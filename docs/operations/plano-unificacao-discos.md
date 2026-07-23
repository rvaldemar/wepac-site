# Plano — usar a máquina como um todo (77.42.82.10)

Estado em 2026-07-23. Servidor Hetzner, Ubuntu 24.04, 8 vCPU, 30 GB RAM.
Quatro produtos em produção: WEPAC, Wedding Magic, mgaccounting, CI/Ops — mais Mailcow (o email da
casa) e Jitsi (as salas de vídeo das sessões WEPACKER).

## 1. O ponto de partida

| Disco | Tamanho | Uso | Papel hoje |
|---|---|---|---|
| `/dev/sda1` | 76 GB | 49 GB · **68%** | tudo: sistema, aplicações, containers |
| `/dev/sdb` | 60 GB | ~2 MB · **1%** | volume Hetzner, vazio desde janeiro |

**Onde estão os 49 GB:**

```
/var        37 G
  /var/lib    28 G
    containerd  17 G   ← maior consumidor isolado
    docker      12 G
    postgresql 209 M
  /var/www     8,4 G   ← as 4 aplicações
  /var/log     544 M
/usr         9,6 G     ← sistema, fica onde está
/home        6,5 G
```

**60% do disco são containers.** Não são as aplicações, não são os dados, não são os logs.

## 2. Porque não se juntam os dois discos num só

A pergunta natural é "porque não faço dos dois um espaço único de 136 GB". A resposta é que o
`/dev/sda1` está formatado em **ext4**, e o ext4 não suporta múltiplos dispositivos — é uma
propriedade do formato, não uma opção por configurar.

Um espaço verdadeiramente único exigiria LVM, btrfs ou ZFS **por baixo** do sistema de ficheiros. E
nenhum desses se instala num disco já formatado e a servir o sistema: implicaria arrancar em modo
rescue com backup completo, ou reinstalar a máquina. Com quatro produtos em produção, o email da
casa incluído, isso é risco desproporcionado para o benefício de ver um número maior no `df`.

Há ainda o `mergerfs`, que apresenta dois diretórios como se fossem um. Funciona, mas acrescenta uma
camada entre quatro produtos e o disco para resolver um problema estético.

## 3. A arquitetura correta — e é outra

Em servidores com volume anexado, a prática correta não é fundir discos. É **separar por função**:

- **Disco de sistema** (`sda`): sistema operativo, binários, configuração. Estável, previsível, ~20 GB.
- **Volume** (`sdb`): o que cresce — containers, aplicações, dados, backups.

Ou seja: a máquina passa a ser usada como um todo não por ter um sistema de ficheiros único, mas por
**nenhum dos dois discos estar parado enquanto o outro sufoca**. É o que o `/dev/sdb` está a fazer há
seis meses.

**Estado final previsto:**

| | Antes | Depois |
|---|---|---|
| `sda` (76 GB) | 49 GB · 68% | **~17 GB · 23%** |
| `sdb` (60 GB) | 2 MB · 1% | **~35 GB · 60%** |

## 4. O plano, por fases

Cada fase é independente, verificável e reversível. **Nenhuma fase avança sem a anterior estar
verificada e estável.** Ordem escolhida por risco crescente, não por ganho.

### Fase 0 — Rede de segurança (sem downtime)

Antes de mover um byte:

1. Confirmar que o backup mais recente da base de dados está íntegro e **fora** deste disco. Os
   backups do WEPAC já estão no volume desde hoje; confirmar o mesmo para os outros produtos.
2. Snapshot do servidor no painel Hetzner. É o único rollback verdadeiro se algo correr muito mal, e
   custa minutos.
3. Registar o estado atual: `df -h`, `lsblk`, `systemctl list-units --state=running`, e a lista de
   containers a correr. Sem isto não há como provar que o "depois" está igual ao "antes".

### Fase 1 — `/var/www` (8,4 GB) · downtime por aplicação, ~1-2 min cada

A menos arriscada, e serve de ensaio para o método. Faz-se **uma aplicação de cada vez**, começando
pela menos crítica (`ci_ops`, 277 MB) e deixando o WEPAC para o fim.

Por aplicação:
```
sudo systemctl stop <serviço>
sudo rsync -aHAX --numeric-ids /var/www/<app>/ /mnt/HC_Volume_104391672/www/<app>/
sudo mv /var/www/<app> /var/www/<app>.old
sudo ln -s /mnt/HC_Volume_104391672/www/<app> /var/www/<app>
sudo systemctl start <serviço>
```
Verificar: serviço `active`, a página responde 200, sem erros no journal. Só então a seguinte.

O `.old` **fica** até todas as aplicações estarem estáveis por 24h. É o rollback: parar, apagar o
symlink, repor o diretório, arrancar.

> Nota: symlink funciona aqui, mas um *bind mount* declarado no `fstab` é mais robusto — sobrevive a
> ferramentas que resolvem symlinks de forma inesperada. Preferir bind mount se o deploy de alguma
> app for sensível a isso (o `deploy.sh` do WEPAC faz `rsync` para uma release nova e troca um
> symlink; testar em `ci_ops` primeiro dirá se há problema).

### Fase 2 — containers (29 GB) · **downtime real: email e vídeo offline**

O maior ganho e o maior cuidado. `containerd` e `docker` são o mesmo stack e movem-se juntos.

**Isto tira o Mailcow e o Jitsi do ar durante a cópia.** Para 29 GB entre discos locais, contar
**10 a 20 minutos**. Escolher janela: fora de horas, e avisar quem depende do email.

```
sudo systemctl stop docker docker.socket containerd
sudo rsync -aHAX --numeric-ids /var/lib/docker/ /mnt/HC_Volume_104391672/docker/
sudo rsync -aHAX --numeric-ids /var/lib/containerd/ /mnt/HC_Volume_104391672/containerd/
```
Depois apontar cada um por configuração, **não por symlink** — ambos suportam nativamente:
- `/etc/docker/daemon.json` → `{"data-root": "/mnt/HC_Volume_104391672/docker"}`
- `/etc/containerd/config.toml` → `root = "/mnt/HC_Volume_104391672/containerd"`

Arrancar por ordem: `containerd` → `docker`. Verificar: os 28 containers voltam, o webmail responde,
uma sala Jitsi abre. Os diretórios antigos ficam intactos até validação; só depois se apagam, e é
isso que liberta os 29 GB.

**Rollback:** parar, reverter as duas configurações, arrancar. Os dados originais nunca foram tocados.

### Fase 3 — `/home/deploy` (5 GB) · sem downtime

Bundles, caches e artefactos de deploy. Mesmo método da Fase 1, sem serviço a parar.

### Fase 4 — higiene contínua

O que evita voltar ao mesmo ponto daqui a seis meses:

- `journalctl --vacuum-time=7d` mensal, ou `SystemMaxUse=500M` em `/etc/systemd/journald.conf`.
- `docker builder prune -f` após deploys pesados — hoje libertou 7,6 GB de cache regenerável.
- Reduzir releases guardadas de 5 para 3 nos deploys.
- Alerta de disco a 75%, antes de apertar.

## 5. O que este plano deliberadamente NÃO faz

- **Não mexe no firewall.** O `ufw` está inativo e há portas expostas (ver o registo de segurança
  separado), mas mexer em regras de firewall por SSH é a forma clássica de perder o acesso ao
  servidor. Faz-se por consola do fornecedor, noutra sessão, com o plano dedicado.
- **Não converte para LVM.** Ver secção 2.
- **Não move o Postgres.** São 209 MB e é a base de dados de produção — mover dados de uma base viva
  para um dispositivo diferente, com o perfil de I/O do volume por caracterizar, é risco sem ganho.
- **Não apaga imagens Docker.** Há 17 GB em imagens sem container associado; apagá-las liberta muito,
  mas se alguma for precisa para recriar um container tem de ser descarregada outra vez. Decisão
  separada, e depois de as movermos deixa de haver urgência.

## 6. Ordem recomendada

1. **Fase 0** hoje — snapshot e verificação de backups. Sem risco.
2. **Fase 1** a seguir, começando por `ci_ops`. Se o método correr bem numa app pequena, corre nas
   outras.
3. **Fase 2** em janela combinada, fora de horas. É a que liberta 29 GB.
4. **Fase 3 e 4** quando convier.

Só a Fase 2 tem downtime de serviços que outras pessoas notam. Tudo o resto é incremental e
reversível.

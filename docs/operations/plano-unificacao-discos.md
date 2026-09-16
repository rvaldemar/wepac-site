# Topologia de armazenamento do servidor (as-built)

> Estado confirmado em 2026-07-23 no servidor `77.42.82.10`. Este documento
> substitui o plano pré-migração: a Fase 2 foi executada; `/var/www` e
> `/home/deploy` não foram movidos.

## Resposta direta

Estamos a usar os dois discos, mas não estão fundidos num sistema de ficheiros
único. Cada disco tem uma função:

| Disco | Mount | Uso verificado | Função |
|---|---|---:|---|
| `/dev/sda1` | `/` | 28 GB / 75 GB (40%) | Ubuntu, aplicações, bases de dados e configuração |
| `/dev/sdb` | `/mnt/HC_Volume_104391672` | 15 GB / 59 GB (27%) | armazenamento persistente de Docker e containerd |

O ext4 do disco raiz não agrega dispositivos. Usar LVM, btrfs, ZFS ou mergerfs
para apresentar um total único acrescentaria uma migração e um modo de falha
sem benefício operacional. A separação por função utiliza a capacidade dos
dois discos sem alterar o filesystem de arranque.

## O que vive em cada disco

Continuam em `/dev/sda1`:

- `/var/www`, incluindo as releases WEPAC;
- `/var/lib/postgresql`;
- `/home/deploy`;
- `/opt/rvs-meet`, incluindo o Compose, segredos e configuração Jitsi montada
  por bind mount;
- sistema operativo, nginx e unidades systemd.

Passaram para `/dev/sdb`:

- Docker data root:
  `/mnt/HC_Volume_104391672/docker`;
- containerd root:
  `/mnt/HC_Volume_104391672/containerd`.

Isto inclui imagens, writable layers, build cache e conteúdo persistente gerido
pelos runtimes. O `state` transitório de containerd permanece em
`/run/containerd`. Não implica que todos os ficheiros das aplicações em
containers tenham sido movidos: bind mounts explícitos continuam no caminho
declarado por cada aplicação.

## Migração executada

Em 2026-07-23:

1. Docker, `docker.socket` e containerd foram parados;
2. os dois data roots foram copiados para o volume preservando ownership, IDs,
   ACLs e atributos estendidos;
3. `/etc/docker/daemon.json` foi configurado com o novo `data-root`;
4. `/etc/containerd/config.toml` foi configurado com o novo `root`;
5. foram instalados drop-ins systemd com
   `RequiresMountsFor=/mnt/HC_Volume_104391672` para Docker e containerd;
6. containerd e Docker foram arrancados e validados;
7. os data roots antigos só foram eliminados depois dos smokes; ficaram
   placeholders vazios em `/var/lib/docker` e `/var/lib/containerd`.

As cópias pré-cutover da configuração permanecem em:

- `/etc/docker/daemon.json.pre-data-root-20260723T123732Z`;
- `/etc/containerd/config.toml.pre-data-root-20260723T123732Z`.

## Evidência pós-migração

O gate final confirmou:

- `/dev/sdb` montado em `/mnt/HC_Volume_104391672`;
- Docker a usar `/mnt/HC_Volume_104391672/docker`;
- containerd a usar `/mnt/HC_Volume_104391672/containerd`;
- containerd, `docker.socket` e Docker em estado `active`;
- os 28 containers do baseline a correr, sem `unhealthy` nem restarts
  inesperados;
- webmail real em `https://mail.missionfederation.com/` a responder 200 e a
  renderizar o login;
- sala real em `https://meet.rvs.solutions/` aberta pelo host autenticado e
  recebida por um guest;
- o gate repetido depois de remover os dados antigos.

O Docker conservava ainda um registo parado e obsoleto `docker-proxy-1`;
por isso `docker ps -a` tinha 29 registos, embora o baseline ativo fosse 28. Em
recuperações futuras, comparar nomes e health states, não apenas uma contagem.

## Espaço libertado

O disco raiz passou de cerca de 49 GB usados para 28 GB usados. A libertação
real atribuível à limpeza foi aproximadamente 15 GB de blocos, não os 29 GB
estimados inicialmente por `du`: as vistas overlay contavam conteúdo de forma
inflacionada. O volume ficou com 15 GB usados e 41 GB livres.

As fases antigas de mover `/var/www` e `/home/deploy` não foram executadas nem
são necessárias com a capacidade atual. PostgreSQL também permanece no disco
raiz. Qualquer futura redistribuição deve ser tratada como trabalho separado,
com backup, rollback e smoke próprios.

## Preflight obrigatório

Antes de reiniciar Docker/containerd, fazer manutenção Jitsi/OpenClaude ou
recuperar o servidor após reboot, provar primeiro o mount, as configurações e
os drop-ins sem chamar a API Docker:

```bash
ssh deploy@77.42.82.10 '
  set -eu
  mount_line="$(findmnt -rn -o SOURCE,TARGET,FSTYPE --target /mnt/HC_Volume_104391672)"
  test "$mount_line" = "/dev/sdb /mnt/HC_Volume_104391672 ext4"
  docker_root="$(sudo python3 -c "import json; print(json.load(open(\"/etc/docker/daemon.json\"))[\"data-root\"])")"
  test "$docker_root" = "/mnt/HC_Volume_104391672/docker"
  containerd_root="$(sudo python3 -c "import tomllib; print(tomllib.load(open(\"/etc/containerd/config.toml\", \"rb\"))[\"root\"])")"
  test "$containerd_root" = "/mnt/HC_Volume_104391672/containerd"
  for unit in docker containerd; do
    dropin="/etc/systemd/system/${unit}.service.d/data-root-mount.conf"
    sudo grep -Fxq "[Unit]" "$dropin"
    sudo grep -Fxq "RequiresMountsFor=/mnt/HC_Volume_104391672" "$dropin"
    systemctl show -p DropInPaths --value "${unit}.service" | grep -Fq "$dropin"
  done
  printf "mount=%s\n" "$mount_line"
  printf "DockerConfigRoot=%s\n" "$docker_root"
  printf "containerdConfigRoot=%s\n" "$containerd_root"
  printf "mount-guards=ok\n"
'
```

Esperado:

```text
mount=/dev/sdb /mnt/HC_Volume_104391672 ext4
DockerConfigRoot=/mnt/HC_Volume_104391672/docker
containerdConfigRoot=/mnt/HC_Volume_104391672/containerd
mount-guards=ok
```

Só depois deste bloco passar se pode arrancar containerd e Docker numa
recuperação. Quando os serviços já devem estar ativos, provar o runtime:

```bash
ssh deploy@77.42.82.10 '
  set -eu
  for unit in containerd docker.socket docker; do
    test "$(systemctl is-active "$unit")" = "active"
    printf "%s=active\n" "$unit"
  done
  docker_runtime="$(sudo docker info --format "{{.DockerRootDir}}")"
  test "$docker_runtime" = "/mnt/HC_Volume_104391672/docker"
  printf "DockerRuntimeRoot=%s\n" "$docker_runtime"
'
```

Esperado:

```text
containerd=active
docker.socket=active
docker=active
DockerRuntimeRoot=/mnt/HC_Volume_104391672/docker
```

Se o mount, um dos roots ou um serviço diferir, parar. Não arrancar Docker
contra os diretórios vazios do disco raiz e não remover os
`RequiresMountsFor`: isso criaria um segundo runtime vazio em vez de recuperar
produção.

## Rollback real

O rollback original, que consistia apenas em reverter duas configurações, já
não é válido porque os dados antigos foram apagados. Recuar agora exige nova
migração:

1. abrir uma janela de manutenção e capturar o baseline de containers;
2. provar que `/dev/sda1` tem espaço para os dados atuais;
3. parar Docker, o socket e containerd;
4. provar que os destinos em `/var/lib` estão vazios, ou isolar quaisquer
   conteúdos parciais; nunca misturar dois stores;
5. copiar os data roots atuais do volume para os destinos vazios, preservando
   metadados;
6. restaurar ou reescrever deliberadamente e validar as configurações;
7. só depois remover os dois drop-ins `RequiresMountsFor` específicos do
   volume, correr `systemctl daemon-reload`, arrancar containerd antes de
   Docker e repetir todos os smokes de containers, webmail, Jitsi, OpenClaude e
   consumidores.

Nunca restaurar só os ficheiros `.pre-data-root-*` enquanto os diretórios em
`/var/lib` estiverem vazios. Se a ativação no disco raiz falhar, os serviços
ficam parados até o store ser reparado ou até serem repostos a configuração e
os guards conhecidos do volume.

## Riscos residuais

- Não ficou confirmado durante esta migração um backup integral off-host do
  runtime Mailcow/Jitsi. Esse backup e um restore drill são um trabalho
  separado.
- O número de containers e o uso de disco são fotografias de 2026-07-23;
  verificar sempre o estado live.
- Uma falha Certbot independente em `abolitionistmisson.org` já existia e não
  pertence a esta migração. Os certificados de Mailcow e Jitsi estavam válidos
  no gate final.

A fonte canónica transversal ao host está no repositório Agents Hub:
`docs/operations/shared-host-storage.md`.

import { describe, expect, it, vi } from "vitest";
import { POST as jibriPost } from "@/app/api/wepacker/session-media/callbacks/jibri/route";
import { POST as hubPost } from "@/app/api/wepacker/session-media/callbacks/hub/route";
import { readBoundedUtf8Body } from "@/lib/wepacker/session-media/http";

describe("Session media callback envelope", () => {
  it.each([jibriPost, hubPost])(
    "rejects a declared body over 512 KiB before reading/parsing",
    async (post) => {
      const arrayBuffer = vi.fn();
      const request = {
        headers: new Headers({ "content-length": String(512 * 1024 + 1) }),
        arrayBuffer,
      } as unknown as Request;
      const response = await post(request);
      expect(response.status).toBe(400);
      await expect(response.text()).resolves.toBe('{"accepted":false}');
      expect(arrayBuffer).not.toHaveBeenCalled();
    },
  );

  it("stops reading a chunked body as soon as it crosses the limit", async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce({
        done: false,
        value: new Uint8Array(300 * 1024),
      })
      .mockResolvedValueOnce({
        done: false,
        value: new Uint8Array(300 * 1024),
      })
      .mockResolvedValueOnce({
        done: false,
        value: new Uint8Array(1),
      });
    const cancel = vi.fn().mockResolvedValue(undefined);
    const releaseLock = vi.fn();
    const request = {
      headers: new Headers(),
      body: {
        getReader: () => ({ read, cancel, releaseLock }),
      },
    } as unknown as Request;

    await expect(readBoundedUtf8Body(request, 512 * 1024)).rejects.toThrow(
      "Callback too large.",
    );
    expect(read).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalled();
    expect(releaseLock).toHaveBeenCalled();
  });
});

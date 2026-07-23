import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  signJitsiRoomToken,
  verifyHubTranscriptionCallback,
  verifyJibriCallback,
} from "@/lib/wepacker/session-media/security";
import {
  assertRecordingMediaObjectKey,
  MAX_HUB_TRANSCRIPT_CHARS,
  validateRecordingMediaEnvelope,
  validHubTranscriptContent,
} from "@/lib/wepacker/session-media/callbacks";

describe("Session media cross-service security contracts", () => {
  it("accepts the published Hub v1 500k transcript boundary only", () => {
    expect(validHubTranscriptContent("x".repeat(MAX_HUB_TRANSCRIPT_CHARS))).toBe(
      true,
    );
    expect(
      validHubTranscriptContent("x".repeat(MAX_HUB_TRANSCRIPT_CHARS + 1)),
    ).toBe(false);
    expect(validHubTranscriptContent("valid\0invalid")).toBe(false);
  });

  it("accepts only one direct audio and video object under the provider id", () => {
    const providerId = "rec_test_0001";
    const valid = [
      {
        kind: "audio",
        object_key: `recordings/${providerId}/audio.m4a`,
      },
      {
        kind: "video",
        object_key: `recordings/${providerId}/meeting.mp4`,
      },
    ];
    expect(validateRecordingMediaEnvelope(valid, providerId)).toHaveLength(2);
    expect(() =>
      assertRecordingMediaObjectKey(
        "recordings/another_recording/audio.m4a",
        providerId,
      ),
    ).toThrow("does not match");
    expect(() =>
      assertRecordingMediaObjectKey(
        `recordings/${providerId}/nested/audio.m4a`,
        providerId,
      ),
    ).toThrow("does not match");
    expect(() =>
      validateRecordingMediaEnvelope([valid[0], valid[0]], providerId),
    ).toThrow("unique audio and video");
    expect(() =>
      validateRecordingMediaEnvelope([...valid, valid[0]], providerId),
    ).toThrow("audio and video");
  });

  it("verifies the fixed rvs-meet recording vector", () => {
    process.env.SESSION_MEDIA_CALLBACK_MAX_SKEW_SECONDS = "300";
    const rawBody =
      '{"schema_version":"1","event_id":"recording.ready:rec_test_0001:abc","event_type":"recording.ready","occurred_at":"2026-07-23T12:00:00Z","canonical_room":"wepac-0123456789abcdef","recording_id":"rec_test_0001","media":[{"kind":"audio","object_key":"recordings/rec_test_0001/audio.m4a","sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","bytes":1234,"duration_seconds":13,"mime_type":"audio/mp4"},{"kind":"video","object_key":"recordings/rec_test_0001/meeting.mp4","sha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","bytes":5678,"duration_seconds":13,"mime_type":"video/mp4"}],"error_code":null}\n';
    const request = new Request("https://wepac.test/callback", {
      method: "POST",
      headers: {
        "X-WEPAC-Recording-Schema-Version": "1",
        "X-WEPAC-Recording-Timestamp": "1784800800",
        "X-WEPAC-Recording-Idempotency-Key":
          "recording.ready:rec_test_0001:abc",
        "X-WEPAC-Recording-Signature":
          "v1=8af3b9bd828a7ebc7d226947c22e4f6c2b38934f6bff08d7cd00200ccd14a8ab",
      },
    });
    expect(
      verifyJibriCallback(
        request,
        rawBody,
        "synthetic-contract-test-key",
        1784800800 * 1_000,
      ),
    ).toMatchObject({
      idempotencyKey: "recording.ready:rec_test_0001:abc",
    });
  });

  it("verifies the fixed Agents Hub receipt vector", () => {
    process.env.SESSION_MEDIA_CALLBACK_MAX_SKEW_SECONDS = "300";
    const rawBody =
      '{"contract_version":"media-transcription.v1","event_id":"11111111-1111-1111-1111-111111111111","event":"media_transcription.ready","occurred_at":"2026-07-23T12:00:00.000Z","transcription_id":"22222222-2222-2222-2222-222222222222","state":"ready","sequence":1,"source_sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","transcript_sha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","provider":"faster-whisper","model":"base","model_version":"base-test","language":"pt","segments":[]}';
    const signature = createHmac(
      "sha256",
      "wepac-callback-test-secret-32-bytes",
    )
      .update(`1784808000.${rawBody}`)
      .digest("hex");
    expect(signature).toBe(
      "90b61d16ea9f627eb6deaa61b9445f526389236f368f71f53636ef45c9424e01",
    );
    const request = new Request("https://wepac.test/callback", {
      method: "POST",
      headers: {
        "X-Hub-Contract-Version": "media-transcription.v1",
        "X-Hub-Timestamp": "1784808000",
        "X-Hub-Event-Id": "11111111-1111-1111-1111-111111111111",
        "X-Hub-Transcription-Id": "22222222-2222-2222-2222-222222222222",
        "X-Hub-Signature-256": `sha256=${signature}`,
      },
    });
    expect(
      verifyHubTranscriptionCallback(
        request,
        rawBody,
        "wepac-callback-test-secret-32-bytes",
        1784808000 * 1_000,
      ),
    ).toMatchObject({
      eventId: "11111111-1111-1111-1111-111111111111",
      transcriptionId: "22222222-2222-2222-2222-222222222222",
    });
  });

  it("mints a room-bound JWT with exact capabilities and session-window TTL", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const token = signJitsiRoomToken({
      secret: "test-secret",
      subject: "meet.jitsi",
      issuer: "wepac",
      audience: "jitsi",
      room: "wepac-0123456789abcdef",
      userId: "mentor-1",
      displayName: "Mentor",
      moderator: true,
      now,
      sessionEndsAt: new Date("2026-07-23T13:30:00.000Z"),
    });
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    expect(payload).toMatchObject({
      iss: "wepac",
      aud: "jitsi",
      sub: "meet.jitsi",
      room: "wepac-0123456789abcdef",
      nbf: 1784807995,
      exp: 1784814300,
      context: {
        features: {
          recording: true,
          livestreaming: false,
          transcription: false,
        },
        user: { id: "mentor-1", moderator: true },
      },
    });
  });
});

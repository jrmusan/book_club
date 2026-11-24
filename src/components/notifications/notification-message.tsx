import type { NotificationType } from "@prisma/client";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { MEETING_WHEN_FORMAT } from "@/lib/dates";
import {
  describeVoters,
  isPollVotePayload,
  type PollVoteChoice,
} from "@/lib/poll-vote-notifications";

function Choice({ choice }: { choice: PollVoteChoice }) {
  return (
    <strong className="font-semibold">
      {choice.startsAt && <LocalDateTime iso={choice.startsAt} options={MEETING_WHEN_FORMAT} />}
      {choice.startsAt && choice.label && " · "}
      {choice.label}
    </strong>
  );
}

export function NotificationMessage({ type, payload }: { type: NotificationType; payload: unknown }) {
  if (type === "POLL_VOTE" && isPollVotePayload(payload)) {
    const { voters, pollTitle } = payload;
    const latest = voters[voters.length - 1];
    if (voters.length === 1 && latest) {
      return (
        <>
          <strong className="font-semibold">{latest.name}</strong>{" "}
          {latest.choice ? (
            <>
              {latest.changed ? "changed their vote to" : "voted for"} <Choice choice={latest.choice} />
            </>
          ) : latest.changed ? (
            "updated their ranking"
          ) : (
            "ranked the books"
          )}{" "}
          in <em>{pollTitle}</em>
        </>
      );
    }
    return (
      <>
        <strong className="font-semibold">{describeVoters(voters)}</strong> voted in{" "}
        <em>{pollTitle}</em>
      </>
    );
  }

  const message = (payload as { message?: string } | null)?.message;
  return <>{message ?? type}</>;
}

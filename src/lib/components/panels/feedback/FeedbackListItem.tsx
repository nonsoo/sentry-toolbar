import {cx} from 'cva';
import {useContext, useMemo} from 'react';
import AssignedTo from 'toolbar/components/AssignedTo';
import RelativeDateTime from 'toolbar/components/datetime/RelativeDateTime';
import IconChat from 'toolbar/components/icon/IconChat';
import IconFatal from 'toolbar/components/icon/IconFatal';
import IconImage from 'toolbar/components/icon/IconImage';
import IconPlay from 'toolbar/components/icon/IconPlay';
import SentryAppLink from 'toolbar/components/SentryAppLink';
import ConfigContext from 'toolbar/context/ConfigContext';
import useReplayCount from 'toolbar/hooks/useReplayCount';
import type {FeedbackIssueListItem} from 'toolbar/sentryApi/types/group';
import type Member from 'toolbar/sentryApi/types/Member';
import type {Organization, OrganizationTeam} from 'toolbar/sentryApi/types/Organization';

export default function FeedbackListItem({
  item,
  teams,
  members,
}: {
  item: FeedbackIssueListItem;
  teams: OrganizationTeam[] | undefined;
  members: Member[] | undefined;
}) {
  const {organizationSlug} = useContext(ConfigContext);
  const {feedbackHasReplay} = useReplayCountForFeedbacks(organizationSlug);
  const hasReplayId = feedbackHasReplay(item.id);
  const isFatal = ['crash_report_embed_form', 'user_report_envelope'].includes(item.metadata.source ?? '');
  const hasAttachments = item.latestEventHasAttachments;
  const hasComments = item.numComments > 0;

  return (
    <div className="px-2">
      <div className="flex flex-col gap-0.25 border-b border-b-translucentGray-200 py-0.75">
        <div className="flex justify-between">
          <FeedbackType item={item} />
          <FeedbackDates firstSeen={item.firstSeen} />
        </div>
        <FeedbackMessage message={item.metadata.value} />
        <div className="flex items-center justify-between">
          <FeedbackProject item={item} />
          <div className="flex flex-row items-center justify-between gap-0.5">
            {hasComments ? <IconChat size="xs" /> : null}
            {isFatal ? <IconFatal size="xs" color="red400" /> : null}
            {hasReplayId ? <IconPlay size="xs" /> : null}
            {hasAttachments ? <IconImage size="xs" /> : null}
            {item.assignedTo ? <AssignedTo assignedTo={item.assignedTo} teams={teams} members={members} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackType({item}: {item: FeedbackIssueListItem}) {
  const {organizationSlug} = useContext(ConfigContext);

  return (
    <span className={cx({truncate: true, 'font-bold': !item.hasSeen, 'text-sm': true})}>
      <SentryAppLink to={{url: `/issues/${item.id}/`, query: {project: organizationSlug}}}>
        {item.metadata.name ?? item.metadata.contact_email ?? 'Anonymous User'}
      </SentryAppLink>
    </span>
  );
}

function FeedbackDates({firstSeen}: {firstSeen: string}) {
  return (
    <span className="flex items-center gap-0.5 whitespace-nowrap text-xs text-gray-300">
      <RelativeDateTime date={new Date(firstSeen)} suffix="ago" />
    </span>
  );
}

function FeedbackMessage({message}: {message: string | null | undefined}) {
  return <div className="block w-full truncate text-xs">{message}</div>;
}

function FeedbackProject({item}: {item: FeedbackIssueListItem}) {
  return <span className="truncate text-xs">{item.shortId}</span>;
}

function useReplayCountForFeedbacks(organization: string | number) {
  const {hasOne, hasMany} = useReplayCount({
    bufferLimit: 25,
    dataSource: 'search_issues',
    fieldName: 'issue.id',
    organization: {slug: organization} as Organization,
    statsPeriod: '90d',
  });

  return useMemo(
    () => ({
      feedbackHasReplay: hasOne,
      feedbacksHaveReplay: hasMany,
      organization,
    }),
    [hasMany, hasOne, organization]
  );
}

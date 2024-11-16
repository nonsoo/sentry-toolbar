import type {QueryFunction} from '@tanstack/react-query';
import useSentryApi from 'toolbar/hooks/fetch/useSentryApi';
import type {FeedbackIssueListItem, Group} from 'toolbar/sentryApi/types/group';
import type Member from 'toolbar/sentryApi/types/Member';
import type {Organization, OrganizationTeam} from 'toolbar/sentryApi/types/Organization';
import type {Project} from 'toolbar/sentryApi/types/Project';
import type {ApiEndpointQueryKey, ApiResult, QueryKeyEndpointOptions} from 'toolbar/types/api';
import type {ParsedHeader} from 'toolbar/utils/parseLinkHeader';

interface QueryKeyAndQueryFn<Data> {
  queryKey: ApiEndpointQueryKey;
  queryFn: QueryFunction<ApiResult<Data>, ApiEndpointQueryKey, ParsedHeader>;
}

export function useOrganizationQuery<Data = Organization>(organizationSlug: string): QueryKeyAndQueryFn<Data> {
  return {
    queryKey: [`/organizations/${organizationSlug}/`, {query: {queryReferrer: 'devtoolbar'}}],
    queryFn: useSentryApi<Data>().fetchFn,
  };
}

export function useProjectQuery<Data = Project>(
  organizationSlug: string,
  projectIdOrSlug: string
): QueryKeyAndQueryFn<Data> {
  return {
    queryKey: [`/projects/${organizationSlug}/${projectIdOrSlug}/`, {query: {queryReferrer: 'devtoolbar'}}],
    queryFn: useSentryApi<Data>().fetchFn,
  };
}

export function useMembersQuery<Data = Member[]>(
  organizationSlug: string,
  projectIdOrSlug: string
): QueryKeyAndQueryFn<Data> {
  return {
    queryKey: [`/projects/${organizationSlug}/${projectIdOrSlug}/members/`, {query: {queryReferrer: 'devtoolbar'}}],
    queryFn: useSentryApi<Data>().fetchFn,
  };
}

export function useTeamsQuery<Data = OrganizationTeam[]>(
  organizationSlug: string,
  projectIdOrSlug: string
): QueryKeyAndQueryFn<Data> {
  return {
    queryKey: [`/projects/${organizationSlug}/${projectIdOrSlug}/teams/`, {query: {queryReferrer: 'devtoolbar'}}],
    queryFn: useSentryApi<Data>().fetchFn,
  };
}

export function useInfiniteIssueListQuery<Data = Group[]>(
  organizationSlug: string,
  options: QueryKeyEndpointOptions
): QueryKeyAndQueryFn<Data> {
  return {
    queryKey: [
      `/organizations/${organizationSlug}/issues/`,
      {...options, query: {limit: 25, queryReferrer: 'devtoolbar', shortIdLookup: 0, ...options.query}},
    ],
    queryFn: useSentryApi<Data>().fetchInfiniteFn,
  };
}

export function useInfiniteFeedbackListQuery<Data = FeedbackIssueListItem[]>(
  organizationSlug: string,
  options: QueryKeyEndpointOptions
): QueryKeyAndQueryFn<Data> {
  return {
    queryKey: [
      `/organizations/${organizationSlug}/issues/`,
      {...options, query: {limit: 25, queryReferrer: 'devtoolbar', shortIdLookup: 0, ...options.query}},
    ],
    queryFn: useSentryApi<Data>().fetchInfiniteFn,
  };
}

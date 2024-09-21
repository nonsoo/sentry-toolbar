import type {UseInfiniteQueryResult, UseQueryResult} from '@tanstack/react-query';
import {Fragment} from 'react';
import type {ApiResult} from 'toolbar/types/api';

export interface Props<Data> {
  children: React.ReactNode;
  queryResult: UseQueryResult<ApiResult<Data>, Error> | UseInfiniteQueryResult<Data, Error>;
  backgroundUpdatingMessage?: () => React.ReactNode;
  errorMessage?: (props: {error: Error}) => React.ReactNode;
  loadingMessage?: () => React.ReactNode;
}

export default function InfiniteListState<Data>({
  backgroundUpdatingMessage = BackgroundUpdatingMessage,
  children,
  errorMessage = ErrorMessage,
  loadingMessage = LoadingMessage,
  queryResult,
}: Props<Data>) {
  const {status, error, isFetching} = queryResult;
  if (status === 'pending') {
    return loadingMessage();
  }
  if (status === 'error') {
    return errorMessage({error: error as Error});
  }

  // It's fetching in the background if:
  // - it's a regular QueryResult, and isFetching is true
  // - it's an InfiniteQueryResult, and itFetching is true, but we're not fetching the next page
  const isBackgroundUpdating =
    isFetching && ('isFetchingNextPage' in queryResult ? !queryResult.isFetchingNextPage : true);

  return (
    <Fragment>
      {children}
      {isBackgroundUpdating ? backgroundUpdatingMessage() : null}
    </Fragment>
  );
}

function LoadingMessage() {
  return <p>Loading...</p>;
}

function ErrorMessage({error}: {error: Error}) {
  return <p>Error: {(error as Error).message}</p>;
}

function BackgroundUpdatingMessage() {
  return <footer>Background Updating...</footer>;
}

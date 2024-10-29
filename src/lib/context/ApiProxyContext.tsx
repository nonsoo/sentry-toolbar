/* eslint-disable react-refresh/only-export-components */
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import CenterLayout from 'toolbar/components/layouts/CenterLayout';
import UnauthPill from 'toolbar/components/unauth/UnauthPill';
import ConfigContext from 'toolbar/context/ConfigContext';
import defaultConfig from 'toolbar/context/defaultConfig';
import {getSentryIFrameOrigin} from 'toolbar/sentryApi/urls';
import ApiProxy, {type ProxyState} from 'toolbar/utils/ApiProxy';

const ApiProxyStateContext = createContext<ProxyState>('connecting');
const ApiProxyContext = createContext<ApiProxy>(new ApiProxy(defaultConfig));

interface Props {
  children: ReactNode;
}

// If the iframe is visible, then we'll let ApiProxyContextProvider render the login button
const VISIBLE_IFRAME = localStorage.getItem('sntry_tlbr__visible_iframe') ?? false;

export function ApiProxyContextProvider({children}: Props) {
  const config = useContext(ConfigContext);
  const {debug, organizationSlug, projectIdOrSlug} = config;

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log('<ApiProxyContextProvider>', ...args);
      }
    },
    [debug]
  );

  const proxyRef = useRef<ApiProxy>(new ApiProxy(config));
  const [proxyState, setProxyState] = useState<ProxyState>('connecting');

  useEffect(() => {
    proxyRef.current.listen();
    proxyRef.current.setOnStatusChanged(setProxyState);

    const proxy = proxyRef.current;
    return () => {
      log('Unmount: calling proxy.dispose()');
      proxy.dispose();
    };
  }, [config, log]);

  const frameSrc = `${getSentryIFrameOrigin(config)}/toolbar/${organizationSlug}/${projectIdOrSlug}/iframe/?logging=${debug ? 1 : 0}`;

  if (VISIBLE_IFRAME) {
    const display = proxyState === 'logged-out' ? 'block' : 'none';
    return (
      <ApiProxyContext.Provider value={proxyRef.current}>
        <ApiProxyStateContext.Provider value={proxyState}>
          <div style={{display}}>
            <CenterLayout>
              <CenterLayout.MainArea>
                <UnauthPill>
                  <iframe referrerPolicy="origin" height="40" width="80" src={frameSrc} />
                </UnauthPill>
              </CenterLayout.MainArea>
            </CenterLayout>
          </div>
          {children}
        </ApiProxyStateContext.Provider>
      </ApiProxyContext.Provider>
    );
  } else {
    return (
      <ApiProxyContext.Provider value={proxyRef.current}>
        <ApiProxyStateContext.Provider value={proxyState}>
          <iframe referrerPolicy="origin" height="0" width="0" src={frameSrc} className="hidden" />
          {children}
        </ApiProxyStateContext.Provider>
      </ApiProxyContext.Provider>
    );
  }
}

/**
 * Hook to access the proxy instance, so we can call `.exec()` and pass messages along
 */
export function useApiProxyInstance() {
  const context = useContext(ApiProxyContext);
  return context;
}

/**
 * Hook to access the proxy state.
 *
 * Messages are dropped when the proxy is not fully ready.
 */
export function useApiProxyState() {
  const context = useContext(ApiProxyStateContext);
  return context;
}

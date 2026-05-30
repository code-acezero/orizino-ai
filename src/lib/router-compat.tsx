import * as React from "react";
import {
  Link as TSLink,
  Navigate as TSNavigate,
  Outlet as TSOutlet,
  useLocation as tsUseLocation,
  useNavigate as tsUseNavigate,
  useParams as tsUseParams,
  useRouter,
} from "@tanstack/react-router";

// Re-exports as-is
export const Outlet = TSOutlet;

// Link wrapper: split string `to` into pathname/search/hash so callers can pass
// "/path?tab=foo#hash" naturally (TanStack Link otherwise treats the whole
// string as the pathname).
export const Link: any = React.forwardRef<HTMLAnchorElement, any>(
  ({ to, search, hash, ...rest }, ref) => {
    if (typeof to === "string" && (to.includes("?") || to.includes("#"))) {
      const [pathWithSearch, h] = to.split("#");
      const [pathname, searchStr] = pathWithSearch.split("?");
      const s: Record<string, string> = {};
      if (searchStr) {
        new URLSearchParams(searchStr).forEach((v, k) => {
          s[k] = v;
        });
      }
      return (
        <TSLink
          ref={ref as any}
          to={pathname as any}
          search={Object.keys(s).length ? (s as any) : search}
          hash={h || hash}
          {...rest}
        />
      );
    }
    return <TSLink ref={ref as any} to={to} search={search} hash={hash} {...rest} />;
  }
);
(Link as any).displayName = "Link";

export const Navigate: any = TSNavigate;

export type NavLinkProps = any;

// NavLink: TanStack Link already supports active className/children functions.
// Map RRD `end` prop to TanStack `activeOptions.exact`.
export const NavLink: any = React.forwardRef<HTMLAnchorElement, any>(
  ({ end, ...rest }, ref) => {
    return (
      <TSLink
        ref={ref as any}
        activeOptions={end ? { exact: true } : undefined}
        {...(rest as any)}
      />
    );
  }
);
NavLink.displayName = "NavLink";

// useNavigate compat: supports both string and options-object signatures,
// plus numeric history navigation (navigate(-1)).
export function useNavigate() {
  const nav = tsUseNavigate();
  const router = useRouter();
  return React.useCallback(
    (to: any, opts?: { replace?: boolean; state?: any }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      if (typeof to === "string") {
        // Split path + search + hash so TanStack accepts it.
        const [pathWithSearch, hash] = to.split("#");
        const [pathname, searchStr] = pathWithSearch.split("?");
        const search: Record<string, string> = {};
        if (searchStr) {
          new URLSearchParams(searchStr).forEach((v, k) => {
            search[k] = v;
          });
        }
        return nav({
          to: pathname as any,
          search: Object.keys(search).length ? (search as any) : undefined,
          hash: hash || undefined,
          replace: opts?.replace,
          state: opts?.state as any,
        });
      }
      return nav(to);
    },
    [nav, router]
  );
}

// useParams compat: return all params loosely typed.
export function useParams<T extends Record<string, string | undefined> = any>(): T {
  return tsUseParams({ strict: false }) as T;
}

// useLocation compat: shape similar to RRD's location object.
export function useLocation() {
  const loc = tsUseLocation();
  const searchStr =
    (loc as any).searchStr ??
    (loc.search
      ? "?" +
        Object.entries(loc.search as Record<string, any>)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "");
  return {
    pathname: loc.pathname,
    search: searchStr,
    hash: loc.hash ?? "",
    state: (loc as any).state ?? {},
    key: (loc as any).key ?? "",
  };
}

// useSearchParams compat: returns [URLSearchParams, setter].
export function useSearchParams(): [
  URLSearchParams,
  (
    next:
      | URLSearchParams
      | Record<string, string>
      | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>),
    opts?: { replace?: boolean }
  ) => void
] {
  const loc = tsUseLocation();
  const nav = tsUseNavigate();

  const params = React.useMemo(() => {
    const sp = new URLSearchParams();
    const search = (loc.search ?? {}) as Record<string, any>;
    Object.entries(search).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) v.forEach((vv) => sp.append(k, String(vv)));
      else sp.set(k, String(v));
    });
    return sp;
  }, [loc.search]);

  const setParams = React.useCallback(
    (next: any, opts?: { replace?: boolean }) => {
      const resolved = typeof next === "function" ? next(params) : next;
      const sp =
        resolved instanceof URLSearchParams
          ? resolved
          : new URLSearchParams(resolved as Record<string, string>);
      const search: Record<string, string> = {};
      sp.forEach((v, k) => {
        search[k] = v;
      });
      nav({
        to: loc.pathname as any,
        search: search as any,
        replace: opts?.replace,
      });
    },
    [nav, loc.pathname, params]
  );

  return [params, setParams];
}

// matchPath stub used occasionally
export function matchPath(_pattern: any, _pathname: string) {
  return null;
}

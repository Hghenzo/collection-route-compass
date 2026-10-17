export function duplicateReason(value: string | null): string | null {
  const reason = value?.trim();
  return reason ? reason : null;
}

export function routeIndicators(
  items: { route_id: string | null; needs_support: boolean; needs_extra_route: boolean }[],
  routes: { id: string; needs_support: boolean; needs_extra_route: boolean; archived: boolean }[],
) {
  const active = routes.filter((route) => !route.archived);
  return {
    support: active.filter((route) => route.needs_support || items.some((item) => item.route_id === route.id && item.needs_support)).length,
    extra: active.filter((route) => route.needs_extra_route).length,
  };
}
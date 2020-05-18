import { useContext, useEffect, useMemo } from "react";
import uuid from "uuid";

import { viewportContext } from "../views/Viewport";

export default function useBreadcrumb({ title, href }) {
  const { breadcrumbsSet } = useContext(viewportContext);
  const id = useMemo(() => uuid.v4(), []);

  const breadcrumb = {
    id,
    title,
    href,
  };

  useEffect(() => {
    breadcrumbsSet(breadcrumbs => [...breadcrumbs, breadcrumb]);
    return () => {
      breadcrumbsSet(breadcrumbs => breadcrumbs.filter(b => b.id !== id));
    };
  }, []);

  useEffect(() => {
    breadcrumbsSet(breadcrumbs =>
      breadcrumbs.map(b => (b.id !== id ? b : breadcrumb)),
    );
  }, [title, href]);
}

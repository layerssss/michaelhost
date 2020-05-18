import React, { useEffect } from "react";
import { useHistory } from "react-router";

export default React.memo(RouteEventListener);
function RouteEventListener() {
  const history = useHistory();
  useEffect(() => {
    const handleClick = function(event) {
      let element = event.target;
      while (!element.matches('a[href^="/"]')) {
        element = element.parentNode;
        if (!element || element === event.currentTarget) return;
      }

      if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey)
        return;
      event.preventDefault();
      history.push(element.getAttribute("href"));
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}

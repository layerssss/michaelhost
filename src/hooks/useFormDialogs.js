import { useContext } from "react";
import uuid from "uuid";

import AbortError from "../services/AbortError";
import { formDialogsContext } from "../providers/FormDialogsProvider";

export default function useFormDialogs() {
  const { formDialogsSet } = useContext(formDialogsContext);
  const showFormDialog = (options) =>
    new Promise((resolve, reject) => {
      const formDialog = {
        ...options,
        id: uuid(),
        open: true,
        cancel: () => reject(new AbortError()),
        done: (formData) => resolve(formData),
      };
      formDialogsSet((formDialogs) => [formDialog, ...formDialogs]);
    });

  return { showFormDialog };
}

import { useState } from "react";

export function useFeedback() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

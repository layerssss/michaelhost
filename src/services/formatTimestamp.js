import moment from "moment";

export default function formatTimestamp(value) {
  if (!value) return "-";
  const valueM = moment(value);
  return `${valueM.format("LLL")} (${valueM.fromNow()})`;
}

import DashboardView from "../views/DashboardView";
import HostsView from "../views/HostsView";
import NewHostView from "../views/NewHostView";
import HostView from "../views/HostView";
import EditHostView from "../views/EditHostView";
import NewTerminalView from "../views/NewTerminalView";
import TerminalView from "../views/TerminalView";
import TerminalsView from "../views/TerminalsView";
import CronJobView from "../views/CronJobView";
import CronJobsView from "../views/CronJobsView";
import NewCronJobView from "../views/NewCronJobView";
import EditCronJobView from "../views/EditCronJobView";
import LogsView from "../views/LogsView";
import ContainersView from "../views/ContainersView";
import ContainerView from "../views/ContainerView";
import ServicesView from "../views/ServicesView";
import ServiceView from "../views/ServiceView";
import VolumesView from "../views/VolumesView";
import VolumeView from "../views/VolumeView";
import ImagesView from "../views/ImagesView";
import ImageView from "../views/ImageView";
import PullImageView from "../views/PullImageView";

const routes = [
  ["/dashboard", DashboardView],
  ["/hosts", HostsView],
  ["/hosts/new", NewHostView],
  ["/hosts/:hostId(\\w{8,})", HostView],
  ["/hosts/:hostId(\\w{8,})/edit", EditHostView],
  ["/terminals", TerminalsView],
  ["/terminals/new", NewTerminalView],
  ["/terminals/:terminalId(\\w{8,})", TerminalView],
  ["/cron_jobs", CronJobsView],
  ["/cron_jobs/new", NewCronJobView],
  ["/cron_jobs/:cronJobId(\\w{8,})", CronJobView],
  ["/cron_jobs/:cronJobId(\\w{8,})/edit", EditCronJobView],
  ["/containers", ContainersView],
  ["/containers/:containerId", ContainerView],
  ["/services", ServicesView],
  ["/services/:serviceId", ServiceView],
  ["/volumes", VolumesView],
  ["/volumes/:volumeId", VolumeView],
  ["/logs", LogsView],
  ["/images", ImagesView],
  ["/images/pull", PullImageView],
  ["/images/:imageId(sha256:.*)", ImageView],
];
export default routes;

"use client";

import Icon from "./Icon";
import { START_TOUR_EVENT } from "./HubTour";

export default function TourButton() {
  return (
    <button
      type="button"
      className="app-menu-item"
      onClick={event => {
        // Close the phone account menu first so the tour isn't hidden behind it.
        event.currentTarget.closest("details")?.removeAttribute("open");
        window.dispatchEvent(new Event(START_TOUR_EVENT));
      }}
    >
      <Icon name="compass" size={16} /> Take the tour
    </button>
  );
}

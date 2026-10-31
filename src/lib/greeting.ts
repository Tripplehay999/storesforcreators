import { TIME_ZONE } from "./format";

// Greetings by time of day, with a few for special days. One is picked per day and time of
// day, so it stays the same on refresh but changes from one day to the next.
const GREETINGS = {
  lateNight: ["Burning the midnight oil, {name}?", "Still up, {name}?", "Night owl hours, {name}", "Late one tonight, {name}"],
  morning: ["Good morning, {name}", "Morning, {name}", "Rise and shine, {name}", "Hey {name}, good morning", "Fresh start, {name}"],
  afternoon: ["Good afternoon, {name}", "Hey {name}", "Afternoon, {name}", "Hope your day's going well, {name}"],
  evening: ["Good evening, {name}", "Evening, {name}", "Hope today was a good one, {name}", "Winding down, {name}?"]
};

const SPECIAL_DAYS: Record<string, string> = {
  "1-1": "Happy New Year, {name}",
  "2-14": "Happy Valentine's Day, {name}",
  "10-31": "Happy Halloween, {name}",
  "12-24": "Happy holidays, {name}",
  "12-25": "Merry Christmas, {name}",
  "12-31": "Happy New Year's Eve, {name}"
};

const WEEKDAY_GREETINGS: Record<string, string[]> = {
  Monday: ["Happy Monday, {name}", "New week, {name}"],
  Friday: ["Happy Friday, {name}", "Made it to Friday, {name}"],
  Saturday: ["Happy Saturday, {name}"],
  Sunday: ["Happy Sunday, {name}"]
};

function parts(now: Date, timeZone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
      weekday: "long",
      month: "numeric",
      day: "numeric",
      year: "numeric"
    }).formatToParts(now).map(part => [part.type, part.value])
  );

  return {
    hour: Number(values.hour),
    weekday: values.weekday,
    month: Number(values.month),
    day: Number(values.day),
    year: Number(values.year)
  };
}

/** A friendly greeting for the time of day in the business timezone, e.g. "Rise and shine, Jasmine". */
export function greeting(name: string, now = new Date(), timeZone = TIME_ZONE) {
  const { hour, weekday, month, day, year } = parts(now, timeZone);
  const special = SPECIAL_DAYS[`${month}-${day}`];
  const period = hour < 5 ? "lateNight" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "lateNight";

  let options = GREETINGS[period];
  if (special && hour >= 5) options = [special];
  else if (WEEKDAY_GREETINGS[weekday] && period !== "lateNight") options = [...options, ...WEEKDAY_GREETINGS[weekday]];

  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  const periodNumber = ["lateNight", "morning", "afternoon", "evening"].indexOf(period);
  const template = options[(dayNumber * 4 + periodNumber) % options.length];
  const trimmed = name.trim();

  // Without a name: "Good morning, {name}" -> "Good morning", "Hey {name}, good morning" -> "Hey, good morning".
  return trimmed
    ? template.replace("{name}", trimmed)
    : template.replace(", {name}", "").replace(" {name}", "");
}

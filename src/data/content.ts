/**
 * Page copy & social proof.
 * Every item with `placeholder: true` is shown in dev only and
 * removed from the production build. Flip it to `false` (or delete
 * the key) once the content is real.
 */

export const categories = [
  { id: 'all', label: 'All' },
  { id: 'long-form', label: 'Long-form' },
  { id: 'talking-head', label: 'Talking-head' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'motion', label: 'Motion' },
  { id: 'short-form', label: 'Short-form / Ads' },
] as const;

export type CategoryId = (typeof categories)[number]['id'];

export const stats = [
  { value: 0, suffix: '+', label: 'Videos edited', placeholder: true },
  { value: 0, suffix: 'M', label: 'Total views', placeholder: true },
  { value: 0, suffix: ' yrs', label: 'Experience', placeholder: true },
  { value: 0, suffix: '%', label: 'Avg. retention gain', placeholder: true },
];

export const clientLogos = [
  { name: 'Client Channel A', placeholder: true },
  { name: 'Client Channel B', placeholder: true },
  { name: 'Client Channel C', placeholder: true },
  { name: 'Client Channel D', placeholder: true },
  { name: 'Client Channel E', placeholder: true },
];

export const testimonials = [
  {
    quote: 'Placeholder testimonial — replace with a real client quote.',
    name: 'Client Name',
    channel: 'Channel Name',
    subscribers: '000K subscribers',
    avatar: '',
    placeholder: true,
  },
  {
    quote: 'Placeholder testimonial — replace with a real client quote.',
    name: 'Client Name',
    channel: 'Channel Name',
    subscribers: '000K subscribers',
    avatar: '',
    placeholder: true,
  },
];

export const services = [
  {
    track: 'V1',
    title: 'Long-Form YouTube',
    blurb: 'Story-first edits that hold attention past the 30-second cliff.',
    items: ['Story structure & pacing', 'B-roll & visual inserts', 'Sound design & mix', 'Subtitles & titles', 'Thumbnail-ready frames'],
  },
  {
    track: 'V2',
    title: 'Talking-Head',
    blurb: 'Tight, energetic cuts that make one camera feel like a production.',
    items: ['Jump-cut rhythm', 'Punch-ins & reframes', 'Kinetic captions', 'Colour correction', 'Audio clean-up'],
  },
  {
    track: 'A1',
    title: 'Podcast Editing',
    blurb: 'Multi-cam episodes and clips built for every platform.',
    items: ['Multi-cam switching', 'Dialogue clean-up & levelling', 'Chapter markers', 'Vertical clip cut-downs', 'Intro / outro packaging'],
  },
  {
    track: 'FX',
    title: 'Motion Graphics & Subtitles',
    blurb: 'Clean, on-brand motion that explains without shouting.',
    items: ['Animated titles & lower thirds', 'Callouts & data visuals', 'Styled subtitle systems', 'Logo stings', 'Templates for your team'],
  },
];

export const process = [
  { tc: '00:00', title: 'Brief', text: 'We align on audience, goal, references and deadline.' },
  { tc: '00:15', title: 'Rough Cut', text: 'Story and structure first: the edit that makes sense end to end.' },
  { tc: '00:45', title: 'Polish', text: 'Sound design, subtitles, motion graphics and colour.' },
  { tc: '01:10', title: 'Revisions', text: 'Clear, timestamped feedback rounds until it feels right.' },
  { tc: '01:30', title: 'Delivery', text: 'Exports for every platform, plus project files on request.' },
];

export const tools = [
  { name: 'Premiere Pro', color: '#9999FF' },
  { name: 'After Effects', color: '#9999FF' },
  { name: 'DaVinci Resolve', color: '#F4B63F' },
  { name: 'Audition', color: '#00E4BB' },
  { name: 'Photoshop', color: '#31A8FF' },
  { name: 'CapCut', color: '#EDEDED' },
];

export const about = {
  placeholder: true,
  paragraphs: [
    'Placeholder about text — a short personal story: how you got into editing, what you care about in a cut, and who you love working with.',
    'Second paragraph placeholder — your approach, your turnaround, what makes working with you easy.',
  ],
  portrait: '', // e.g. /media/portrait.avif
};

export const rawVsEdited = {
  placeholder: true,
  before: '', // /media/raw-vs-edited/raw.mp4
  after: '', // /media/raw-vs-edited/edited.mp4
};

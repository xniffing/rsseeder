# ARCHIVE Design System

## Overview

`ARCHIVE` is an editorial RSS reader with a restrained, archival UI language:

- Monochrome-first palette with a single deep red accent
- Sharp, square geometry with no soft card rounding
- Strong contrast between structural sans typography and literary serif body copy
- Magazine-style spacing, asymmetry, and whitespace
- UI that feels curated, print-like, and deliberate rather than app-like

This document is the source of truth for components, pages, templates, and visual rules.

## Brand Direction

### Core Traits

- Editorial
- Archival
- Minimal
- Severe
- Intellectual
- Monochrome with red signal accents

### Product Tone

- Quiet, confident, and highly curated
- Prioritizes reading depth over feed velocity
- Feels closer to a journal archive than a social content app

## Design Tokens

### Color Palette

#### Core Surfaces

- `background`: `#f9f9f9`
- `surface`: `#f9f9f9`
- `surface-bright`: `#f9f9f9`
- `surface-dim`: `#dadada`
- `surface-variant`: `#e2e2e2`
- `surface-container-lowest`: `#ffffff`
- `surface-container-low`: `#f3f3f3`
- `surface-container`: `#eeeeee`
- `surface-container-high`: `#e8e8e8`
- `surface-container-highest`: `#e2e2e2`

#### Text and Structure

- `on-background`: `#1a1c1c`
- `on-surface`: `#1a1c1c`
- `on-surface-variant`: `#474747`
- `outline`: `#777777`
- `outline-variant`: `#c6c6c6`
- `secondary`: `#5e5e5e`
- `secondary-container`: `#d4d4d4`
- `tertiary`: `#3b3b3b`
- `tertiary-container`: `#747474`

#### Accent and Actions

- `primary`: `#000000`
- `primary-container`: `#7e0000`
- `primary-fixed`: `#c00000`
- `primary-fixed-dim`: `#930000`
- `surface-tint`: `#c00000`
- `inverse-primary`: `#ffb4a8`

#### Semantic Support

- `error`: `#ba1a1a`
- `error-container`: `#ffdad6`
- `on-error`: `#ffffff`
- `on-error-container`: `#410002`

### Typography

#### Families

- `headline`: `Space Grotesk`
- `label`: `Space Grotesk`
- `body`: `Newsreader`

#### Usage Rules

- Use `Space Grotesk` for navigation, labels, metadata, headings, counters, and buttons
- Use `Newsreader` for summaries, long-form article text, captions, and editorial descriptions
- Uppercase is a system feature, not decoration; use it for navigation, metadata, chips, and section markers
- Tight tracking and heavy weight are preferred for headlines
- Serif body copy should remain spacious and readable, especially in reading mode

#### Type Scale

- Display XL: `text-8xl`, bold, tight leading
- Display L: `text-7xl`, bold
- Display M: `text-5xl`, bold
- Heading L: `text-4xl`
- Heading M: `text-3xl`
- Heading S: `text-2xl`
- Body L: `text-2xl`
- Body M: `text-xl`
- Body S: `text-lg`
- Label M: `text-sm`
- Label S: `text-xs`
- Label XS: `text-[10px]`

### Shape

- Global radius: `0px`
- `lg`: `0px`
- `xl`: `0px`
- `full`: `9999px`

Rule: default to hard edges. Circular badges are only valid for dots, unread markers, and fully round icon containers.

### Motion

#### General

- Motion is subtle and editorial, never playful
- Favor opacity, grayscale, scale, and border-color transitions
- Avoid springy or bouncy animation

#### Standard Patterns

- Hover color shift: `duration-200` to `duration-300`
- Image reveal: grayscale to full color, `duration-500` to `duration-1000`
- Slight scale on featured imagery or FABs: `hover:scale-105` or `hover:scale-110`
- Reading progress is a thin red line at the top of the viewport

## Layout Principles

### Grid

- Desktop layouts use strong multi-column composition, commonly `12` columns
- Mobile stacks vertically with fixed bottom navigation
- Negative space is intentional and should be preserved
- Content should feel offset and editorial, not centered into generic cards

### Containers

- Main content widths:
  - Feed/editorial pages: `max-w-6xl`
  - Library pages: `max-w-7xl`
  - Reading/article view: custom wide canvas, up to `1440px`
  - Add/discover flow: `max-w-5xl`

### Spacing

- Use large vertical intervals: `mb-16`, `mb-20`, `mt-24`, `mt-32`
- Headline sections should breathe
- Dense utility-style spacing should be avoided unless used for metadata clusters

### Borders and Dividers

- Use thin lines for structure instead of shadows
- Prefer `border-outline-variant` or low-opacity neutral borders
- Sections often end with strong horizontal dividers

## Interaction Patterns

### Navigation

- Desktop: sticky or fixed top app bar
- Mobile: fixed bottom navigation with 4 primary destinations
- Current section uses red accent and slightly stronger emphasis

### Feedback

- Unread state uses a red dot plus uppercase status
- Active links are red
- Hover states shift text to red or increase image clarity
- Progress is communicated with slim bars, counters, and metadata instead of heavy badges

### Search and Discovery

- Search inputs are large, minimal, and underlined
- Discovery can use bento layouts, editorial lists, and manual feed input
- Input framing should remain stark and typographic

## Core Components

### Top App Bar

Purpose: global navigation and mode context.

Structure:

- Left: menu/back/close control + wordmark
- Center or inline nav on desktop
- Right: search or secondary actions

Rules:

- Sticky or fixed at top
- Background matches page surface
- Horizontal padding should feel generous
- Wordmark uses `Space Grotesk`, bold, uppercase or near-uppercase styling

### Bottom Navigation

Purpose: primary mobile navigation.

Items:

- Library
- Feed
- Discover
- Saved

Rules:

- Fixed to bottom on mobile only
- Flat surface with top border
- Active item uses red accent and stronger visual weight

### Reading Progress Bar

Purpose: communicates scroll/read position.

Rules:

- Fixed to top
- Height `2px`
- Track uses muted surface tone
- Fill uses `primary-fixed`

### Floating Action Button

Purpose: contextual quick action such as filter, refresh, or return-to-top.

Rules:

- Square or circular utility treatment is acceptable
- Use black or neutral fill on light backgrounds
- Motion should be restrained
- Only present when contextually useful

### Editorial Hero

Purpose: introduces page context with publication-like authority.

Structure:

- Eyebrow label with divider line
- Oversized headline
- Supporting intro copy
- Optional date, issue, or volume marker

Rules:

- Headline must dominate the fold
- Use asymmetry on desktop when possible

### Feed Article Card

Purpose: list item for article stream.

Variants:

- Standard unread item
- Standard read item
- Featured large item
- Minimal list item

Common anatomy:

- Metadata column: source, freshness, unread state
- Content column: title, summary, tags
- Optional image accent column

Rules:

- Titles use `Space Grotesk`
- Summaries use `Newsreader`
- Unread is signaled with red dot and uppercase label
- Hover may shift background tone and accent title

### Source Card

Purpose: represent an RSS source/publication in the library.

Anatomy:

- Image or monochrome artwork
- Source name
- Descriptor line
- New/cached status badge
- Optional outbound arrow icon

Rules:

- Imagery should default to grayscale
- Status badge sits over image
- Card remains flat and hard-edged

### Filter Chips

Purpose: filter source collections or feed categories.

Rules:

- Hard-edged pill-like blocks are acceptable
- Active chip uses stronger surface or text emphasis
- Use uppercase `label` typography

### Section Divider Heading

Purpose: break content into archive-like categories.

Style:

- Tiny uppercase label
- Wide tracking
- Often prefixed by a numeric index
- Bottom border for structure

### Search Field

Purpose: add feed, search publications, or manual discovery.

Rules:

- Large input text
- Minimal chrome
- Underline or thin border only
- Icon aligned to the right edge

### Recommendation List Row

Purpose: discover new sources.

Anatomy:

- Thumbnail
- Category label
- Source title
- One-line description
- Subscriber or metadata block
- Add button

Rules:

- Rows feel like editorial index entries, not cards
- Hover background shifts subtly

### Long-Form Reading Article

Purpose: distraction-minimized reading mode.

Anatomy:

- Slim top utility nav
- Large headline
- Lead image
- Long-form body text
- Pull quote
- Inline feature block
- Footer actions

Rules:

- Body line length should remain comfortable
- Serif type is primary for article content
- Headline can mix bold, italic, and color accents sparingly
- Peripheral metadata can sit in a left rail on large screens

### Action Buttons

Variants:

- Primary: black or dark fill, light text
- Secondary: outlined, neutral border
- Utility icon button: low-chrome symbol control

Rules:

- Use uppercase `label` typography
- Keep corners square
- Avoid heavy shadows

### Status Markers

Variants:

- Unread
- Featured
- Cached
- New count

Rules:

- Red is reserved for important active state and unread urgency
- Neutral badges are used for passive archive states like cached

## Page Templates

### 1. Editorial Home / Latest Entries

Purpose: front page for current reading inventory.

Includes:

- Sticky top bar
- Editorial hero
- Mixed feed list
- Load more footer action
- Mobile bottom nav
- Optional floating filter button

Use when:

- Showing latest articles across all subscribed feeds
- Presenting a curated, magazine-like first impression

### 2. Library / Sources

Purpose: browse subscribed publications and collections.

Includes:

- Fixed top bar
- Page hero with CTA
- Filter chips
- Asymmetric grid of featured sources
- Indexed list of secondary journals
- Footer status line
- Mobile bottom nav
- Refresh-style FAB

Use when:

- Managing subscriptions
- Browsing sources by category or importance

### 3. Reading View

Purpose: focused article consumption.

Includes:

- Reading progress bar
- Minimal top nav
- Large article canvas
- Optional sticky metadata rail
- Rich editorial typography
- Save/share/export controls
- Return-to-top action

Use when:

- Reading a saved or opened article
- Archival presentation matters more than app chrome

### 4. Discover / Add Feed

Purpose: add new RSS sources through search or direct URL.

Includes:

- Sticky top bar with close action
- Large search entry
- Curated category bento
- Recommendation rows
- Manual feed input section
- Mobile bottom nav

Use when:

- Searching for new publications
- Adding RSS, Atom, or XML feeds directly

## Content Patterns

### Headlines

- Bold, compressed, and assertive
- May use punctuation as visual device, especially trailing periods
- Can mix upright and italic emphasis sparingly

### Metadata

- Always uppercase or small label styling
- Wide tracking
- Secondary color by default
- Dates and timing should feel like archive references, not social timestamps

### Summaries

- Written as editorial abstracts
- Never casual or clickbait-heavy
- Body font should retain literary tone

### Imagery

- Prefer grayscale or muted editorial imagery
- Use color reveal on hover when helpful
- Imagery should support mood, not dominate information density

## Accessibility Guidance

- Preserve strong contrast between text and surface
- Do not rely on red alone for meaning when state is important; pair with label text or icons
- Ensure text scales cleanly on mobile
- Large serif text in reading mode should maintain clear line height
- Interactive areas must remain obvious despite minimal chrome

## Implementation Guidance

### Tailwind Foundations

Base assumptions from the provided system:

- `darkMode: "class"`
- Extended custom color tokens
- `Space Grotesk` and `Newsreader` loaded as primary type families
- Border radius mostly locked to `0`

### Frontend Rules

- Do not introduce soft, rounded SaaS components
- Do not use gradient-heavy or colorful marketing treatments
- Avoid default dashboard UI patterns
- Prefer editorial composition, whitespace, and hierarchy over dense widgets
- Keep shadows minimal; structure should come from layout, borders, and contrast

## Component Inventory

Minimum first-pass UI inventory for the app:

- Top app bar
- Bottom mobile nav
- Reading progress bar
- Editorial hero
- Feed article card
- Featured article card
- Minimal list article row
- Source card
- Source list row
- Filter chip group
- Search field
- Recommendation row
- Primary button
- Secondary button
- Icon button
- Status badge
- Floating action button
- Metadata rail
- Pull quote block
- Manual feed input form

## Page Inventory

Minimum first-pass page inventory for the app:

- Home / Latest Entries
- Feed / All Articles
- Library / Sources
- Reading View / Article
- Discover / Add Feed
- Saved / Bookmarks

## Anti-Patterns

Do not introduce:

- Rounded glassmorphism panels
- Bright multi-color palettes
- Generic startup dashboard widgets
- Excessive shadows
- Tight cramped spacing
- Loud animation
- Social-media style engagement chrome

## One-Sentence Summary

Design `ARCHIVE` like a contemporary literary archive: square, typographic, monochrome, spacious, and punctuated only by deliberate red signals.

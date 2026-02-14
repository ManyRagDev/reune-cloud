Pop Brutalista

Product Overview

The Pitch: Rolê is the anti-spreadsheet event planner for people who actually have fun. We strip away the neurotic coordination of Potlucks and replace it with a loud, chaotic-good interface that makes organizing a BBQ feel like part of the party, not the homework before it.

For: Social organizers who are tired of chasing friends in WhatsApp groups. They care about headcount, who's bringing the ice, and getting it done in under 30 seconds.

Device: mobile

Design Direction: Neo-Brutalism meets 90s Zine culture. High-contrast acid colors, heavy black borders, overlapping elements, and sticker-style iconography. It feels raw, urgent, and loud.

Inspired by: Gumroad, Figma's FigJam, MTV circa 1996.



Screens





Home (The Feed): Vertical stack of upcoming chaos.



Create Event (The Setup): Mad-libs style event generator.



Event Dashboard (The Hub): Central command for a specific BBQ.



Guest List (The Crew): RSVP tracking with shame/fame mechanics.



Supplies (The Stash): Checklist for beer, meat, and ice.



Key Flows

Flow: Creating a BBQ





User opens Home -> sees giant "NOVA BAGUNÇA" (New Mess) button.



User taps New Mess -> enters Create Event modal.



User fills "What," "When," "Where" in big blocky inputs -> taps "CONFIRM."



Result: User lands on Event Dashboard with a shareable link ready to copy.

Flow: Claiming an Item





User opens shared link -> lands on Event Dashboard.



User taps "Bring Stuff" -> navigates to Supplies.



User taps "Picanha (2kg)" -> item turns filled green with user's avatar stamped on it.



Design System

Color Palette





Primary: #CCFF00 - Acid Lime (Main actions, highlights)



Secondary: #FF00FF - Electric Magenta (Accents, urgency)



Background: #F2F0E9 - Off-white Newsprint



Surface: #FFFFFF - Cards (always with borders)



Text: #000000 - Pure Black (No grays for text)



Borders: #000000 - 3px solid everywhere



Alert: #FF4800 - International Orange (Errors, missing items)

Typography





Headings: Space Grotesk, 700, 32-48px (Tight tracking -0.04em)



Body: Space Mono, 400, 14px (Tech/Raw feel)



Buttons: Space Grotesk, 700, 16px (Uppercase)



Stamps/Stickers: Permanent Marker, 400, 20px (Rotated elements)

Style notes:





Hard Shadows: 4px 4px 0px 0px #000000 on everything. No blur.



Borders: Every container has a 3px solid black border.



Corners: sharp 0px radius on main containers, 999px pills for tags.



Overlaps: Elements intentionally overlap sections by -10px to create depth.

Design Tokens

:root {
  --color-primary: #CCFF00;
  --color-secondary: #FF00FF;
  --color-bg: #F2F0E9;
  --color-surface: #FFFFFF;
  --color-text: #000000;
  --border-width: 3px;
  --shadow-hard: 4px 4px 0px 0px #000000;
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'Space Mono', monospace;
  --radius-none: 0px;
}





Screen Specifications

Home (The Feed)

Purpose: View upcoming events and quickly start a new one.

Layout:





Header: Sticky top. Logo left, User Avatar right (circle, thick border).



Body: Vertical list of cards. Infinite scroll feel.



FAB: Bottom right fixed button.

Key Elements:





App Header: Text "ROLÊ" in 48px Space Grotesk, skewed -5deg. Underlined with a squiggle SVG.



Event Card:





White background, 3px border, Hard Shadow.



Date Box: Top left, yellow square, black text. "12 OUT".



Title: "Churras do Pedro". 24px Bold.



Status Badge: Pill shape, Magenta. "FALTAM 2 DIAS".



Avatars: Overlapping circles of confirmed guests.



New Event FAB:





64x64px square (not circle). Acid Lime background.



Icon: Giant plus sign +.



Interaction: Scales down 95% on click.

States:





Empty: Giant sticker graphic of a lonely beer bottle. Text: "TÁ MORTO AQUI. CRIA UM ROLÊ." (It's dead here. Create a rolê.)



Create Event (The Setup)

Purpose: Input essential details fast.

Layout: Full screen modal. Slide up animation.

Key Elements:





Title Input: "NOME DO ROLÊ". No label, placeholder is "Ex: Churras da Laje". Background: White. Border: 3px Black. Text: 32px.



Date/Time Picker: Two side-by-side native inputs styled with hard borders. Background: #E0E0E0.



Location: Input field. Right icon: Map pin.



Theme Selector: Horizontal scroll of emoji stickers (🥩, 🍺, 🍕, 🎉). Selected state: Yellow background, black border.



Submit Button: Full width bottom. Height: 60px. Text: "BOTA PRA GERAR" (Make it happen). Color: Acid Lime.

Interactions:





Focus: Input background turns Acid Lime when active.



Error: Shake animation. Border turns Orange.



Event Dashboard (The Hub)

Purpose: The single source of truth for the event.

Layout:





Hero: Big title, messy collage background.



Action Grid: 2x2 grid of big buttons.



Feed: Recent activity log at bottom.

Key Elements:





Hero Section:





Title: "Churras do Pedro" (40px).



Subtitle: "Sábado, 14:00" (Mono font).



Background: Dotted pattern.



The Grid (Nav):





Button 1 (Guests): "QUEM VAI" (Who goes). White bg. Icon: Eyes.



Button 2 (Supplies): "O QUE LEVAR" (What to bring). White bg. Icon: Basket.



Button 3 (Chat): "RESENHA" (Chat). White bg. Icon: Speech bubble.



Button 4 (Settings): "AJUSTES". White bg. Icon: Gear.



RSVP Toggle:





Giant switch at the top. "TÔ DENTRO" (I'm in) vs "TÔ FORA" (I'm out).



"In" state: Lime Green. "Out" state: Gray.



Guest List (The Crew)

Purpose: See who is coming and manage status.

Layout: List view divided by status.

Key Elements:





Counter: Top banner. "14 CONFIRMADOS". Marquee scrolling effect if text is long.



List Item:





Row height: 72px.



Left: Avatar (Square, 3px border).



Center: Name + "Trazendo: [Item Name]" (if assigned).



Right: Status icon (Checkmark or Skull).



Invite Button: Floating sticky bar at bottom. "CHAMAR MAIS GENTE" (Call more people). Copies link to clipboard. Toast notification: "LINK COPIADO, MANDA LÁ!"

States:





Loading: Skeleton rows with jagged shimmering effect (not smooth fade).



Supplies (The Stash)

Purpose: Collaborative checklist for food/drinks.

Layout: Categorized lists (Comes, Bebes, Outros).

Key Elements:





Category Header: Black block, White text. Rotated -2deg. e.g., "MAMAR (BEBIDAS)".



Item Row (Unclaimed):





White background. Text: "Cerveja (3 caixas)".



Action: Button "EU LEVO" (I'll bring). Magenta background.



Item Row (Claimed):





Lime Green background (#CCFF00).



Text: Strikethrough style.



Avatar of claimer on the right.



Add Item Input:





Bottom of list. "Adicionar item..." + Enter key to submit.

Interactions:





Claiming: Click "EU LEVO" -> Row flashes white -> fills Green -> confetti pop.





Build Guide

Stack: HTML + Tailwind CSS v3

Build Order:





Design System & Layout Wrapper: Define the border-3, shadow-hard, and font stack. Build the main container with the dotted background.



Event Dashboard: This is the core hub. It tests the grid system and component density.



Supplies Screen: Implements the complex state logic (claimed vs unclaimed) and list styles.



Create Event: Form components and validation states.



Home: Feed logic is secondary to the event management itself.

Tailwind Config Nuances:





Extend boxShadow with the hard shadow utility.



Add space and space-grotesk to fontFamily.



Add custom colors lime-acid, magenta-electric.



Set default border width to 0, use utility classes for the specific 3px borders.


<div align="center">

<img src="./assets/readme-banner.svg" alt="DelicateStones — Unique beaded treasures, strung by hand" width="100%">

<br>

### Handmade beaded jewelry, by Daniya

[![Live Site](https://img.shields.io/badge/live_site-visit-b6893c?style=for-the-badge&logo=googlechrome&logoColor=white)](https://zainabsharif.github.io/Delicate-Stones/)
[![Instagram](https://img.shields.io/badge/instagram-@__delicatestones__-e2c88f?style=for-the-badge&logo=instagram&logoColor=white&labelColor=b6893c)](https://instagram.com/_delicatestones_)
[![WhatsApp](https://img.shields.io/badge/whatsapp-message_daniya-4c6a63?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/923211782222)

</div>

<br>

<div align="center">
&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;
</div>

<br>

## ✨ About

A single-page website for the **DelicateStones** jewelry brand — showcasing the collection, linking straight to Instagram and WhatsApp, and answering customer questions through a built-in chat assistant. No build tools, no backend, no dependencies — just one clean, self-contained site.

<br>

<div align="center">

| | | |
|:---:|:---:|:---:|
| 🪶 **Showcase the collection** | 💬 **One-tap WhatsApp ordering** | 📸 **Instagram integration** |
| Bracelets, necklaces, earrings, and made-to-order pieces, presented cleanly | Every product and the floating button open a pre-filled WhatsApp chat | Direct links to the brand's Instagram profile |
| 🤖 **Automated customer service** | 📱 **Fully responsive** | 🎨 **Custom design system** |
| Instant answers on pricing, materials, shipping, and care — hands off to WhatsApp when needed | Looks and works cleanly on mobile, tablet, and desktop | Bead-motif signature styling throughout, not a generic template |

</div>

<br>

<div align="center">
&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;
</div>

<br>

## 🛠️ Built with

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-17140f?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-b6893c?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-4c6a63?style=flat-square&logo=javascript&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-hosted-e2c88f?style=flat-square&logo=github&logoColor=black)

</div>

No frameworks, no npm install, no build step. Fonts are [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (display) and [Jost](https://fonts.google.com/specimen/Jost) (body), loaded from Google Fonts. The whole site is one HTML file plus an `assets` folder — it can be hosted anywhere.

<br>

## 📁 Project structure

```
Delicate-Stones/
├── index.html               the entire site — HTML, CSS, and JS
├── assets/
│   ├── logo.jpg               brand logo — nav, footer, hero medallion
│   └── readme-banner.svg      banner used at the top of this README
└── README.md
```

<br>

## 🚀 Running it locally

No installation required.

```bash
git clone https://github.com/zainabsharif/Delicate-Stones.git
cd Delicate-Stones
```

Then either open `index.html` directly in a browser, or — for the most accurate preview — use VS Code's **Live Server** extension: right-click `index.html` → **Open with Live Server**.

<br>

## 🎨 Editing the site

Everything lives inside `index.html`, laid out top to bottom in the order it appears on the page:

| Section | What it controls |
|---|---|
| `<style>` block | Colors, fonts, spacing — see the CSS variables at the top for the full palette |
| Nav | Logo, menu links, WhatsApp button |
| Hero | Headline, tagline, medallion graphic |
| `#collection` | Product cards — name, description, and WhatsApp link per item |
| `#about` | Brand story and values |
| `#instagram` | Instagram preview grid and follow link |
| `#order` | The three-step ordering process |
| Footer | Contact details and links |
| `<script>` block | Bead-divider generator, and the chat assistant's logic — its `FAQ` array holds every question it can answer |

To swap in real product photography, replace the placeholder `<svg>` illustrations inside `.card-art` with `<img>` tags pointing to files in `assets/`.

<br>

## 🌐 Deployment

Hosted with **GitHub Pages**, served directly from the `main` branch. Every push to `main` updates the live site within a minute or two — no manual deploy step.

To deploy your own copy:

```
1. Fork or clone this repo
2. Push to your own GitHub repository
3. Settings → Pages → Source → Deploy from a branch → main / root
4. Live at https://<your-username>.github.io/<repo-name>/
```

<br>

<div align="center">
&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9679;&nbsp;&nbsp;&#9675;&nbsp;&nbsp;&#9679;
</div>

<br>

<div align="center">
<i>Made to order, one bead at a time.</i>
<br><br>
<b>— Daniya</b>
</div>

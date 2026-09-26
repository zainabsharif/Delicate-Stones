<div align="center">

# ✦ DelicateStones ✦

### *Handmade beaded jewelry, by Daniya*

●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●

<br>

[![Live Site](https://img.shields.io/badge/live_site-visit-b6893c?style=for-the-badge&logo=googlechrome&logoColor=white)](https://zainabsharif.github.io/Delicate-Stones/)
[![Instagram](https://img.shields.io/badge/instagram-@delicatestones__-e2c88f?style=for-the-badge&logo=instagram&logoColor=white&labelColor=b6893c)](https://www.instagram.com/delicatestones_/)
[![WhatsApp](https://img.shields.io/badge/whatsapp-message_daniya-4c6a63?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/923211782222)

</div>

<br>


> *Every piece is beaded one bead at a time — designed to elevate your daily style, from a quiet morning to a night out.*

<br>

●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●

<br>

https://github.com/user-attachments/assets/1b5c4b69-0a15-4a07-8890-ea61ef5065b8


<br>


## ✦ About

A  website for the **DelicateStones** jewelry brand — showcasing the collection, taking orders through a cart and checkout, and linking straight to Instagram and WhatsApp. No build tools and no server to run: the pages are plain HTML/JS on GitHub Pages, with a free Firebase database behind the shop.

<br>

## ✦ Features

| | |
|---|---|
| **🪶 The Collection** | Bracelets, necklaces, earrings, and made-to-order pieces, presented cleanly |
| **🛒 Cart & Checkout** | Add pieces to a cart and finalise the order with cash on delivery or online payment — online payment hands the customer to WhatsApp to ask Daniya for account details |
| **🗂️ Store Owner Page** | `admin.html` — add and price pieces, approve orders, mark them delivered and paid |
| **⭐ Verified Reviews** | Customers can review a piece only after an order of it has been delivered |
| **💬 One-Tap Questions** | Every product and the floating button open a pre-filled WhatsApp chat |
| **📸 Instagram Linked** | Direct links straight to the brand's Instagram profile |
| **🤖 Automated Support** | Instant answers on pricing, materials, shipping, and care — hands off to WhatsApp when needed |
| **📱 Fully Responsive** | Looks and works cleanly on mobile, tablet, and desktop |
| **🎨 Custom Design** | A beaded-motif signature style throughout — not a generic template |

<br>

●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●

<br>

## ✦ Built With

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-17140f?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-b6893c?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-4c6a63?style=flat-square&logo=javascript&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-hosted-e2c88f?style=flat-square&logo=github&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-Firestore_+_Auth-17140f?style=flat-square&logo=firebase&logoColor=white)

</div>

No frameworks, no `npm install`, no build step. Fonts are [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (display) and [Jost](https://fonts.google.com/specimen/Jost) (body), loaded from Google Fonts. The Firebase SDK loads from Google's CDN as ES modules.

<br>

## ✦ Project Structure

```
Delicate-Stones/
├── index.html              home page
├── collections.html        the shop — product grid, cart, reviews
├── admin.html              store owner page (not linked from the site)
├── firestore.rules         database security rules — paste into Firebase console
├── assets/
│   ├── css/shop.css          cart, checkout, modal and review styles
│   ├── js/
│   │   ├── firebase-config.js  ← your Firebase project settings go here
│   │   ├── store.js            database access, cart, orders, reviews
│   │   ├── cart-ui.js          cart drawer + checkout (all pages)
│   │   ├── collections.js      product grid, filters, reviews modal
│   │   ├── home.js             latest reviews on the home page
│   │   ├── admin.js            store owner dashboard
│   │   └── catalogue-seed.js   the original 45 pieces, for the first import
│   ├── Items/                product photos
│   └── logo.jpg              brand logo
└── README.md
```

<br>

## ✦ Running It Locally

No installation required.

```bash
git clone https://github.com/zainabsharif/Delicate-Stones.git
cd Delicate-Stones
```

Then use VS Code's **Live Server** extension: right-click `index.html` → **Open with Live Server**. (Opening the file directly with a `file://` address won't work — the shop scripts are ES modules, which browsers only load over `http://`.)

Until Firebase is configured, the site shows the original catalogue without prices, cart or reviews.

<br>

●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●

<br>

## ✦ Editing the Site

**Products, prices, orders and reviews are managed on `admin.html`**, not in the HTML. Page layout and copy live in `index.html` and `collections.html`:

| Section | What It Controls |
|---|---|
| `<style>` block | Colors, fonts, spacing — see the CSS variables at the top for the full palette |
| Nav | Logo, menu links (the cart button is added by `cart-ui.js`) |
| Hero | Headline, tagline, medallion graphic |
| `#bestsellers` | Best Sellers row on the home page (still hand-written) |
| `#reviews` | Filled with the latest verified reviews from the database |
| `#about` | Brand story and values |
| `#instagram` | Instagram preview grid and follow link |
| `#order` | The three-step ordering process |
| Footer | Contact details and links |

<br>

## ✦ Store Backend Setup (Firebase)

One-time setup, all on the free **Spark** plan:

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (Google Analytics not needed).
2. **Project settings → Your apps → Web (`</>`)** → register an app → copy the `firebaseConfig` values into `assets/js/firebase-config.js`.
3. **Build → Firestore Database → Create database** → production mode → pick a nearby region.
4. In Firestore's **Rules** tab, replace everything with the contents of `firestore.rules` → **Publish**.
5. **Build → Authentication → Get started → Email/Password** → enable it. In the **Users** tab, **Add user** with Daniya's email and a password, then copy that user's **User UID**.
6. Back in **Firestore → Data**: **Start collection** `admins` → Document ID = the UID → add any field (e.g. `name` = `Daniya`) → Save.
7. Optional hardening: **Authentication → Settings → User actions** → untick *Enable create (sign-up)* so nobody else can create accounts.
8. Open `admin.html`, sign in, go to **Products → Import starter catalogue**, then type a price next to each piece. Pieces without a price show *"Price on request"* and can't be added to the cart.

### How it works

| | |
|---|---|
| **Orders** | Checkout saves an order to the `orders` collection (status *New*, unpaid). Only the store owner can read orders — they contain phone numbers and addresses. |
| **Online payment** | After ordering, the customer gets a button that opens WhatsApp to Daniya with the order number, items, total, and a request for account details. The customer taps Send — a website can't send WhatsApp messages on its own without the paid WhatsApp Business API. |
| **Order status** | On `admin.html`: *Approve* → *Mark delivered*, and *Mark paid* / *Mark unpaid* at any time. *Cancel* before delivery. |
| **Reviews** | Marking an order delivered records which pieces that phone number bought. The review form asks for the phone number used to order; the database rules refuse any review that doesn't match a delivered purchase, and allow one review per piece per customer. The owner can delete reviews. |
| **Photos** | Photos uploaded on `admin.html` are shrunk and stored inside the product record, because file storage isn't on the free plan. You can also type a path such as `./assets/Items/Bracelets/…jpeg` for photos committed to the repo. |

<br>

## ✦ Deployment

Hosted with **GitHub Pages**, served directly from the `main` branch. Every push to `main` updates the live site within a minute or two — no manual deploy step.

To deploy your own copy:

```
1. Fork or clone this repo
2. Push to your own GitHub repository
3. Settings → Pages → Source → Deploy from a branch → main / root
4. Live at https://<your-username>.github.io/<repo-name>/
```

<br>

●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●&nbsp;&nbsp;●&nbsp;&nbsp;○&nbsp;&nbsp;●

<br>

<div align="center">

*Made to order, one bead at a time.*

**— Daniya**

</div>

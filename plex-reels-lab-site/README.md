# PLEX Reels Content Lab

Reels Lab · Quick Timeline · Documentation — სტატიკური საიტი GitHub Pages-ისთვის.
საერთო მონაცემები (timeline, სტატუსები, სცენარის ტექსტები) ინახება Firebase Firestore-ში, ასე რომ ყველას, ვისაც ბმული აქვს, შეუძლია ნახვა და რედაქტირება.

## 1. Firebase
უკვე აწყობილია (პროექტი `plex-reels-lab`, config ჩაწერილია `firebase-config.js`-ში).

## 2. GitHub Pages
1. github.com → **New repository** → სახელი `plex-reels-lab` → Public → Create.
2. **Add file → Upload files** → გადმოათრიე ამ საქაღალდის ყველა ფაილი (docs საქაღალდის ჩათვლით) → Commit.
3. **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save.
4. 1–2 წუთში საიტი გაიხსნება: `https://<შენი-username>.github.io/plex-reels-lab/`

პირველი გახსნისას timeline ავტომატურად შეივსება `seed.json`-იდან (ერთხელ).

## შენიშვნა
- რედაქტირება ღიაა ყველასთვის, ვისაც ბმული აქვს — ბმული მხოლოდ გუნდს და სააგენტოს გაუზიარე.
- Firebase config საჯარო გასაღებია (ასე არის ჩაფიქრებული); დაცვას წესები (`firestore.rules`) განსაზღვრავს.

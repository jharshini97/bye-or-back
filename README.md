# Bye or Back

Web application for tracking discontinued and seasonal grocery products.

## Authors

Suk Jin Mun (Discontinued Products) and Alejandra Aimee Rivas Montes (Seasonal Products)

## Class link

[CS5610 Web Development, Northeastern University](https://johnguerra.co/classes/webDevelopment_online_fall_2026/)

## Objective

Shoppers search discontinued products by name or brand, see which seasonal products are available each month or season, and add, edit, or delete reports. Each author owns one MongoDB collection with full CRUD through Node, Express, and vanilla JavaScript.

### Demo User Selection

Bye or Back uses a simulated user selector based on the personas defined in our project user stories.

Users can select a persona or choose **No user** to browse as a visitor.

- **No user:** Can browse, search, and view products.
- **Selected persona:** Can browse, add, edit, and delete products through the user interface.

The selected persona is stored in `sessionStorage` and used to populate the `lastEditedBy` field whenever a product is edited. The application will also record the modification date in `lastEditedAt`.

**Important:** This feature is for demonstration purposes only. It does not provide real authentication or authorization. Users can freely select a persona, and the recorded editor's identity is not verified. Backend API endpoints are not protected by this selector.

## Design documents

- [Discontinued Products, Suk Jin Mun](https://drive.google.com/file/d/1uPjrQy9pjRdQTSbbA8YmrdIl5tvl85P8/view?usp=sharing)
- [Seasonal Products, Alejandra Aimee Rivas Montes](https://docs.google.com/document/d/1mXePnsW6ohuy7B4YRAlxCzTVjUg_EhXZ/edit?usp=sharing&ouid=102296971848383812505&rtpof=true&sd=true)



## Screenshot


![Home page](screenshots/homepage.png)

![Discontinued Products page](screenshots/discontinued.png)

![Seasonal Products page](screenshots/seasonal.png)

##Video demo
https://youtu.be/Ma6keYYv9Ws


## Instructions to build

1. Install Node 22.12 or later and run `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to the MongoDB Atlas connection string.
3. Run `npm run import:discontinued` once. It loads the 1,968 products in `data/discontinued-products.json`, taken from the April 2026 USDA FoodData Central Branded Foods release (products with a discontinued date, one per UPC).
4. Run `npm run import:seasonal` once. It loads the 1,200 products in `data/seasonal-products.json`.
5. Run `npm start`, open http://localhost:3000, and log in as a demo user from the top right menu with any password to add, edit, or delete products.
6. Run `npm run lint` to check the code with ESLint and Prettier.

## License

Released under the [MIT License](LICENSE).

## Code freeze

Suk Jin Mun's last code commit before the code freeze on 2026.10.19 at 2:59 pm ET is f9bc9be.
Alejandra Aimee Rivas Montes last code commit before the code freeze on 2026.10.19 at 2:59 pm ET is d7bf01a

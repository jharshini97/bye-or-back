# bye-or-back

Web application for tracking discontinued and seasonal grocery products

### Demo User Selection

Bye or Back uses a simulated user selector based on the personas defined in our project user stories.

Users can select a persona or choose **No user** to browse as a visitor.

- **No user:** Can browse, search, and view products.
- **Selected persona:** Can browse, add, edit, and delete products through the user interface.

The selected persona is stored in `sessionStorage` and used to populate the `lastEditedBy` field whenever a product is edited. The application will also record the modification date in `lastEditedAt`.

**Important:** This feature is for demonstration purposes only. It does not provide real authentication or authorization. Users can freely select a persona, and the recorded editor's identity is not verified. Backend API endpoints are not protected by this selector.

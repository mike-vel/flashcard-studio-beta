# Flashcard Studio (Beta)
**Flashcard Studio offers a great way to retain information**, from memorizing names to dates and other relevant information. By promoting active recall, you can ensure that you don’t forget the information that you learned.

This project uses Tailwind CSS, a utility-first open-source CSS framework for styling. Edit `tailwind.config.js` to customize the configuration.

## Features:
 - Create questions (identification & enumeration)
 - Manage your reviewer (edit & remove cards)
 - Answer flashcards (moves to “For Later” deck)
 
## Plans for future updates:
 - Group multiple Tailwind CSS classes for easier code readability
 - Make the website accessible
 - New homepage where you can manage groups of flashcards
 - Add Dark Mode
 - UI Revamps

## Project Structure

```
flashcard-studio
├── public/                 # HTML files
├── src                     # CSS and JS files
│   ├── ...
│   └── libs/               # Libraries used
├── .vscode
│   └── settings.json       # Settings for VS Code
├── .gitattributes          # how files are handled by Git
├── .gitignore              # which files are not tracked by Git
├── package.json            # npm configuration
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # Project documentation
```

## How to Get Started

1. **Clone this repository:** Simple as that!
2. **Install Dependencies:** Run `npm install` to install the necessary packages.
3. **Start Development:** Run `npm run dev` to start development. It automatically tracks the changes and rebuilds the compiled CSS.
4. **Open in browser:** Open any html file in the `public` folder to see your changes.
5. **Deploy changes:** Use `npm run build` to compile the minified CSS from the input file.

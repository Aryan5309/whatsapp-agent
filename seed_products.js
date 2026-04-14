const fs = require('fs');
const path = require('path');

const categories = ['Men', 'Women', 'Shoes', 'Accessories'];
const adjectives = ['Classic', 'Modern', 'Vintage', 'Premium', 'Streetwear', 'Elegant', 'Casual', 'Sporty', 'Luxury', 'Summer'];
const items = {
    'Men': ['Shirt', 'Jeans', 'Jacket', 'T-Shirt', 'Suit', 'Trousers', 'Hoodie'],
    'Women': ['Dress', 'Skirt', 'Top', 'Blouse', 'Gown', 'Jeans', 'Sweater'],
    'Shoes': ['Sneakers', 'Loafers', 'Boots', 'Heels', 'Sandals', 'Running Shoes'],
    'Accessories': ['Watch', 'Sunglasses', 'Belt', 'Wallet', 'Handbag', 'Backpack']
};

const products = [];

let idCounter = 1;
for (let i = 0; i < 60; i++) {
    // Pick a random category
    const category = categories[Math.floor(Math.random() * categories.length)];
    // Pick a random adjective
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    // Pick a random item for the category
    const itemArr = items[category];
    const item = itemArr[Math.floor(Math.random() * itemArr.length)];
    
    // Construct name and image
    const name = `${adjective} ${item}`;
    // Random price between 500 and 5000
    const price = Math.floor(Math.random() * 45) * 100 + 500;
    
    // Generate a simple placeholder image URL with the product name on it
    const imageUrl = `https://fakeimg.pl/400x400/282828/eae0d0/?text=${encodeURIComponent(item)}`;

    products.push({
        id: `P${idCounter.toString().padStart(2, '0')}`,
        name: name,
        category: category,
        price: price,
        image_url: imageUrl,
        description: `High-quality ${category.toLowerCase()} fashion. Make a bold statement with our ${name}.`
    });

    idCounter++;
}

fs.writeFileSync(path.join(__dirname, 'products.json'), JSON.stringify(products, null, 2));

console.log(`Successfully generated ${products.length} products in products.json!`);

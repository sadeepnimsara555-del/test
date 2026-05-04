const MenuItem = require('../models/MenuItem');

// @desc    Process chatbot query
// @route   POST /api/chatbot/query
// @access  Private
const processQuery = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Please provide a message' });
    }

    const lowerMessage = message.toLowerCase();
    let responseText = '';
    let suggestedItems = [];

    const getRandomItems = async (matchQuery, size = 3) => {
      const items = await MenuItem.aggregate([
        { $match: matchQuery },
        { $sample: { size } }
      ]);
      return await MenuItem.populate(items, { path: 'restaurantId', select: 'name' });
    };

    const isPlural = /\b(foods|drinks|beverages|burgers|pizzas|sandwiches|appetizers|desserts|sweets|items|options|recommendations|some|few)\b/i.test(lowerMessage);
    const itemLimit = isPlural ? 2 : 1;

    // --- 1. Keywords & Response Logic ---

    // Spicy
    if (lowerMessage.includes('spicy') || lowerMessage.includes('hot')) {
      suggestedItems = await getRandomItems({
        $or: [
          { name: { $regex: 'spicy|chili|hot|peri', $options: 'i' } },
          { description: { $regex: 'spicy|chili|hot|peri', $options: 'i' } }
        ],
        isAvailable: true
      }, itemLimit);
      
      if (suggestedItems.length > 0) {
        responseText = isPlural 
          ? `Spice lover, eh? 🌶️ Here are a couple of fiery options that I think you'll really enjoy!`
          : `Oh, you like a little heat! 🌶️ I highly recommend this one. It's got a great kick to it!`;
      } else {
        responseText = "I looked everywhere, but I couldn't find any spicy dishes right now. 😔 Maybe a comforting main course instead?";
      }
    }
    
    // Drinks
    else if (lowerMessage.includes('drink') || lowerMessage.includes('beverage') || lowerMessage.includes('thirsty')) {
      suggestedItems = await getRandomItems({ category: 'Drinks', isAvailable: true }, itemLimit);
      responseText = isPlural
        ? "Need to quench your thirst? 🥤 I picked out a couple of really refreshing options for you!"
        : "Thirsty? 🥤 Here's a super refreshing drink for you!";
    }

    // Burgers / Specific Fast Food
    else if (lowerMessage.includes('burger') || lowerMessage.includes('pizza') || lowerMessage.includes('sandwich') || lowerMessage.includes('fast food')) {
      suggestedItems = await getRandomItems({ category: 'Fast Food', isAvailable: true }, itemLimit);
      responseText = isPlural
        ? "I totally get that craving! 🍔 Here are a couple of awesome fast food picks for you to check out."
        : "Craving some fast food? 🍔 This one is definitely a crowd favorite!";
    }

    // Combos
    else if (lowerMessage.includes('combo') || lowerMessage.includes('meal') || lowerMessage.includes('suggest a combo')) {
      const mainItems = await getRandomItems({ category: 'Main Course', isAvailable: true }, 1);
      const drinkItems = await getRandomItems({ category: 'Drinks', isAvailable: true }, 1);
      const dessertItems = await getRandomItems({ category: 'Desserts', isAvailable: true }, 1);
      
      const main = mainItems[0];
      const drink = drinkItems[0];
      const dessert = dessertItems[0];
      
      if (main && drink && dessert) {
        suggestedItems = [main, drink, dessert];
        responseText = `I've put together the ultimate meal for you! 🍱 A delicious main (${main.name}), a refreshing drink, and a sweet treat to finish it off. What do you think?`;
      } else {
        responseText = "I'm still trying to piece together the perfect combo for you... 🍔 How about we start with a nice main course first?";
      }
    }

    // General Hunger
    else if (lowerMessage.includes('hungry') || lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      suggestedItems = await getRandomItems({ isAvailable: true }, itemLimit);
      responseText = isPlural
        ? "I've got you covered! 🍕 Here are a couple of really popular dishes that always hit the spot."
        : "Stomach rumbling? 🍕 Let me suggest one of our absolute bestsellers for you to try!";
    }

    // Categories
    else if (lowerMessage.includes('appetizer') || lowerMessage.includes('starter')) {
      suggestedItems = await getRandomItems({ category: 'Appetizers', isAvailable: true }, itemLimit);
      responseText = isPlural
        ? "Starting off small is always a good idea! 🥗 Check out a couple of these delicious starters."
        : "Looking for a quick bite to start? 🥗 This appetizer is fantastic!";
    }
    else if (lowerMessage.includes('dessert') || lowerMessage.includes('sweet')) {
      suggestedItems = await getRandomItems({ category: 'Desserts', isAvailable: true }, itemLimit);
      responseText = isPlural
        ? "You can't skip dessert! 🍰 Here are a couple of sweet treats that are totally irresistible."
        : "Got a sweet tooth? 🍰 I think you'll absolutely love this one!";
    }

    // Navigation / Help
    else if (lowerMessage.includes('how to') || lowerMessage.includes('help') || lowerMessage.includes('guide')) {
      responseText = "I'm always here to help! 🙋‍♂️ You can search for food at the top, filter by category, or just ask me for a recommendation!";
    }

    // Fallback
    else {
      responseText = "Hmm, I'm not entirely sure what you're in the mood for. 🤔 Could you tell me if you'd like a combo, something spicy, or maybe a sweet dessert?";
    }

    // Always try to guide user
    if (!responseText.includes('search') && !responseText.includes('order') && !responseText.includes('help')) {
      responseText += " Feel free to ask for more ideas, or tap on any item to order it right away! ✨";
    }

    res.json({
      reply: responseText,
      items: suggestedItems
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  processQuery,
};

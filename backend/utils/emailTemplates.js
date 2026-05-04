const getNewFoodTemplate = (name, restaurantName, category, price, description, image, frontendUrl, itemUrl) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: none; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">New Culinary Delight!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Freshly added to our menu just for you</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="position: relative; border-radius: 20px; overflow: hidden; margin-bottom: 30px; background-color: #f8f9fa;">
          <img src="${image}" alt="${name}" style="width: 100%; height: auto; display: block;" />
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div style="flex: 1;">
            <h2 style="margin: 0; color: #2d3436; font-size: 24px; font-weight: 700;">${name}</h2>
            <p style="margin: 5px 0 0 0; color: #ff4757; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${category}</p>
          </div>
          <div style="background-color: #f1f2f6; padding: 10px 15px; border-radius: 15px;">
            <span style="font-size: 20px; font-weight: 800; color: #2d3436;">$${price}</span>
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 15px; margin-bottom: 30px; border-left: 4px solid #ff4757;">
          <p style="margin: 0; color: #636e72; font-style: italic; line-height: 1.6;">"${description}"</p>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="margin: 0 0 10px 0; color: #b2bec3; font-size: 12px; font-weight: 700; text-transform: uppercase;">Available at</p>
          <div style="display: flex; align-items: center;">
            <div style="width: 40px; height: 40px; background-color: #ff4757; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
              <span style="color: white; font-weight: bold; font-size: 20px;">🏪</span>
            </div>
            <span style="font-weight: 700; color: #2d3436; font-size: 16px;">${restaurantName}</span>
          </div>
        </div>

        <div style="text-align: center; padding-top: 10px;">
          <a href="${itemUrl}" style="background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 18px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(255, 71, 87, 0.3);">Order Now</a>
        </div>
      </div>

      <div style="background-color: #f1f2f6; padding: 30px; text-align: center;">
        <p style="margin: 0; color: #b2bec3; font-size: 12px; line-height: 1.5;">You received this because you opted in for new food updates.<br/>Manage your preferences in your <a href="${frontendUrl}/profile" style="color: #ff4757; text-decoration: none; font-weight: bold;">Profile Settings</a>.</p>
      </div>
    </div>
  `;
};

const getDeletedFoodTemplate = (name, restaurantName, reason) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: none; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #2d3436 0%, #636e72 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Menu Update</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">An item has been removed from the menu</p>
      </div>
      
      <div style="padding: 40px 30px; text-align: center;">
        <div style="width: 80px; height: 80px; background-color: #f1f2f6; border-radius: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px;">
          <span style="font-size: 40px;">🗑️</span>
        </div>
        
        <h2 style="margin: 0; color: #2d3436; font-size: 22px; font-weight: 700;">Farewell to ${name}</h2>
        <p style="margin: 15px 0 30px 0; color: #636e72; font-size: 16px; line-height: 1.6;">
          Please note that <strong>${name}</strong> is no longer available at <strong>${restaurantName}</strong>. 
          Don't worry, there are plenty of other delicious options waiting for you!
        </p>

        <div style="background-color: #fdf2f2; padding: 20px; border-radius: 15px; display: inline-block;">
          <p style="margin: 0; color: #d63031; font-weight: 600; font-size: 14px;">Status: Item Discontinued</p>
        </div>
      </div>

      <div style="background-color: #f1f2f6; padding: 30px; text-align: center;">
        <p style="margin: 0; color: #b2bec3; font-size: 12px; line-height: 1.5;">Thank you for being part of Foodie App.<br/>Stay tuned for more updates!</p>
      </div>
    </div>
  `;
};

module.exports = {
  getNewFoodTemplate,
  getDeletedFoodTemplate
};

export const unique = async (req, res, next) => {
  console.log("Unique middleware triggered");
  console.log("User-Agent:", req.get("User-Agent"));
  console.log("IP:", req.ip);
  next();
};

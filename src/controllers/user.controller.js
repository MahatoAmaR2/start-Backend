import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  // get user detils
  const { userName, email, fullName, password } = req.body;
  // validation
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }
  // check user existence
  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  // check image,avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log("avatar file: ", req.files());
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  // upload them on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  // entry in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    userName: userName.toLowerCase(),
    password,
  });
  // -remove password and refresh token field
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }
  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };
// Registre user steps follow:-
// -------get user detils from frontend[done]
// -------validation - not empty[done]
// -------check user if already exist: username or email[done]
// -------check for images, check for avatar[done]
// -------upload them to cloudinary, avtar[done]
// -------create user object - create entry in db[done]
// -------remove password and refresh token field from response[done]
// -------check for user creation[done]
// -------return response

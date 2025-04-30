import UserModel from "../Models/userModel.js";
import bcrypt from 'bcrypt';
import NotificationModel from "../Models/notificationModel.js"



export const getUser = async(req,res)=>{
    const id = req.params.id;

    try {
        const user = await UserModel.findById(id).select('-password');
        if(user){
            res.status(200).json(user);
        }
        else{
            res.status(404).json({message:"User not found"});
        }
    } catch (error) {
        res.status(500).json(error);
        
    }

}


// Add this to your UserController.js file to log the update request

export const updateUser = async(req,res)=>{
    const id = req.params.id;
    const { currentUserId, currentUserAdminStatus, password } = req.body;

    console.log('Update user request:', {
        id,
        currentUserId,
        currentUserAdminStatus,
        body: req.body
    });

    if(id === currentUserId || currentUserAdminStatus){
        try {
            if(password){
                req.body.password = await bcrypt.hash(password, 10);
            }

            const user = await UserModel.findByIdAndUpdate(id, req.body, {new:true, runValidators:true});
            
            if (!user) {
                console.log('User not found for update');
                return res.status(404).json({message: "User not found"});
            }
            
            console.log('User updated successfully:', user);
            res.status(200).json(user);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({message: error.message});
        }
    }
    else{
        console.log('Unauthorized update attempt');
        res.status(401).json({message:"Unauthorized to update this user! You can update only your account"});
    }
}


export const deleteUser = async(req,res)=>{
    const id = req.params.id;

    const {currentUserId, currentUserAdminStatus} = req.body;

    if(currentUserId===id || currentUserAdminStatus){
        try {
            await UserModel.findByIdAndDelete(id);
            res.status(200).json("User Deleted Successfully!");
            navigate("/login");
        } catch (error) {
            res.status(500).json(error);
        }
    }
    else{
        res.status(401).json({message:"Unauthorized to delete this user! You can delete only your account"});
    }
}

const createNotification = async (recipientId, senderId, type, postId = null) => {
    try {
      console.log(`Creating notification in UserController: recipient=${recipientId}, sender=${senderId}, type=${type}`)
  
      const notificationData = {
        recipient: recipientId,
        sender: senderId,
        type,
      }
  
      // Only add post field if it's provided and not null
      if (postId) {
        notificationData.post = postId
      }
  
      const notification = new NotificationModel(notificationData)
  
      const savedNotification = await notification.save()
      console.log("Notification created successfully in UserController:", savedNotification)
      return savedNotification
    } catch (error) {
      console.error("Error creating notification in UserController:", error)
      return null
    }
  }
  
  // Keep all your existing functions, but modify followUser:
  
  export const followUser = async (req, res) => {
    const id = req.params.id
    const { currentUserId } = req.body
  
    if (currentUserId === id) {
      return res.status(403).json({ message: "Action Forbidden. You can't follow yourself!" })
    }
  
    try {
      const followUser = await UserModel.findById(id)
      const followingUser = await UserModel.findById(currentUserId)
  
      // Check if either user doesn't exist
      if (!followUser || !followingUser) {
        return res.status(404).json({ message: "User not found" })
      }
  
      if (!followUser.followers.includes(currentUserId)) {
        await followUser.updateOne({ $push: { followers: currentUserId } })
        await followingUser.updateOne({ $push: { following: id } })
  
        // Create follow notification
        console.log(`Creating follow notification: from ${currentUserId} to ${id}`)
        try {
          await createNotification(id, currentUserId, "follow")
          console.log("Follow notification created successfully")
        } catch (notifError) {
          console.error("Failed to create follow notification:", notifError)
        }
  
        return res.status(200).json({ message: "Successfully followed the user!" })
      } else {
        return res.status(400).json({ message: "You are already following this user" })
      }
    } catch (error) {
      console.error("Error in followUser:", error)
      return res.status(500).json({ message: "Server error while following user", error: error.message })
    }
  }



export const unFollowUser = async (req, res) => {
    const id = req.params.id;
    const { currentUserId } = req.body;

    if (currentUserId === id) {
        return res.status(403).json({ message: "Action Forbidden. You can't follow yourself!" });
    }

    try {
        const followUser = await UserModel.findById(id);
        const followingUser = await UserModel.findById(currentUserId);

        if (!followUser || !followingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (followUser.followers.includes(currentUserId)) {
            await followUser.updateOne({ $pull: { followers: currentUserId } });
            
            await followingUser.updateOne({ $pull: { following: id } });

            return res.status(200).json({ message: "Successfully unfollowed the user!" });
        } else {
            return res.status(400).json({ message: "You are not following this user now!" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error while unfollowing user" });
    }
};



export const getAllUsers = async (req, res) => {
    try {
      const users = await UserModel.find().select("-password");
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error while fetching users" });
    }
  };

  export const getMultipleUsers = async (req, res) => {
    const { ids } = req.body; // Array of user IDs
    try {
      const users = await UserModel.find({ _id: { $in: ids } }).select('-password');
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error while fetching users" });
    }
  };
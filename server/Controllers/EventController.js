import EventModel from "../Models/eventModel.js";

export const createEvent = async (req, res) => {
  try {
    const newEvent = new EventModel(req.body);
    const saved = await newEvent.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const { department, upcoming } = req.query;
    const query = {};
    if (department && department !== "All") query.department = department;
    if (upcoming === "true") query.eventDate = { $gte: new Date() };
    const events = await EventModel.find(query).sort({ eventDate: 1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleAttend = async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const idx = event.attendees.indexOf(userId);
    if (idx === -1) event.attendees.push(userId);
    else event.attendees.splice(idx, 1);
    await event.save();
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { currentUserId, currentUserAdminStatus } = req.body;
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.createdBy !== currentUserId && !currentUserAdminStatus) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await EventModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

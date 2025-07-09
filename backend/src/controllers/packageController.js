// src/controllers/packageController.js

import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Helper to insert into bookable_item and return ID
async function insertBookableItem({ type, title, description, price, created_by }) {
    const result = await db.one(
        `INSERT INTO bookable_item (type, title, description, price, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING bookable_item_id`,
        [type, title, description, price, created_by]
    );
    return result.bookable_item_id;
}

export const createFlight = asyncHandler(async (req, res) => {
    const { title, description, price, created_by, airline, flight_number, origin_id, destination_id, departure_time, arrival_time } = req.body;
    const id = await insertBookableItem({ type: 'flight', title, description, price, created_by });
    await db.none(
        `INSERT INTO flight (flight_id, airline, flight_number, origin_id, destination_id, departure_time, arrival_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, airline, flight_number, origin_id, destination_id, departure_time, arrival_time]
    );
    res.status(201).json({ success: true, flight_id: id });
});

export const createAccommodation = asyncHandler(async (req, res) => {
    const { title, description, price, created_by, hotel_name, location_id, room_type, check_in, check_out } = req.body;
    const id = await insertBookableItem({ type: 'accommodation', title, description, price, created_by });
    await db.none(
        `INSERT INTO accommodation (accommodation_id, hotel_name, location_id, room_type, check_in, check_out)
     VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, hotel_name, location_id, room_type, check_in, check_out]
    );
    res.status(201).json({ success: true, accommodation_id: id });
});

export const createActivity = asyncHandler(async (req, res) => {
    const { title, description, price, created_by, activity_name, location_id, activity_type, duration_minutes, start_time, end_time } = req.body;
    const id = await insertBookableItem({ type: 'activity', title, description, price, created_by });
    await db.none(
        `INSERT INTO activity (activity_id, activity_name, location_id, activity_type, duration_minutes, start_time, end_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, activity_name, location_id, activity_type, duration_minutes, start_time, end_time]
    );
    res.status(201).json({ success: true, activity_id: id });
});

export const createPackage = asyncHandler(async (req, res) => {
    const { title, description, price, created_by, destination_id, start_date, end_date, group_size } = req.body;
    const id = await insertBookableItem({ type: 'package', title, description, price, created_by });
    await db.none(
        `INSERT INTO travel_package (package_id, destination_id, start_date, end_date, group_size, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, destination_id, start_date, end_date, group_size, created_by]
    );
    res.status(201).json({ success: true, package_id: id });
});

export const addModuleToPackage = asyncHandler(async (req, res) => {
    const { packageId } = req.params;
    const { module_id, included_by_default = true } = req.body;
    await db.none(
        `INSERT INTO package_module (package_id, module_id, included_by_default)
        VALUES ($1, $2, $3)`,
        [packageId, module_id, included_by_default]
    );
    res.status(201).json({ success: true });
});

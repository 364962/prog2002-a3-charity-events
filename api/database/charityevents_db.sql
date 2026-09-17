-- Good Together: a fictional Gold Coast charity events dataset.
-- Import into a fresh MySQL 5.7+ database. No existing tables are removed.
CREATE DATABASE IF NOT EXISTS charityevents_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE charityevents_db;
SET NAMES utf8mb4;
SET time_zone = '+10:00';
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE TABLE organisations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  mission TEXT NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organisation_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  summary VARCHAR(255) NOT NULL,
  purpose VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  venue VARCHAR(150) NOT NULL,
  location VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  fundraising_goal DECIMAL(12,2) NOT NULL,
  amount_raised DECIMAL(12,2) NOT NULL DEFAULT 0,
  image_path VARCHAR(255) NOT NULL,
  image_alt VARCHAR(255) NOT NULL,
  accessibility VARCHAR(500) NOT NULL,
  publication_status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  CONSTRAINT fk_event_organisation FOREIGN KEY (organisation_id)
    REFERENCES organisations(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_event_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_event_visibility_end (publication_status, ends_at),
  INDEX idx_event_category_start (category_id, starts_at),
  INDEX idx_event_start (starts_at)
) ENGINE=InnoDB;

-- MySQL 5.7 ignores CHECK clauses. Enforce the invariants on both write paths.
DELIMITER $$
CREATE TRIGGER events_before_insert BEFORE INSERT ON events FOR EACH ROW
BEGIN
  IF NEW.ends_at <= NEW.starts_at OR NEW.ticket_price < 0
    OR NEW.fundraising_goal <= 0 OR NEW.amount_raised < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid event dates or monetary values';
  END IF;
END$$
CREATE TRIGGER events_before_update BEFORE UPDATE ON events FOR EACH ROW
BEGIN
  IF NEW.ends_at <= NEW.starts_at OR NEW.ticket_price < 0
    OR NEW.fundraising_goal <= 0 OR NEW.amount_raised < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid event dates or monetary values';
  END IF;
END$$
DELIMITER ;

START TRANSACTION;
INSERT INTO organisations (id, name, mission, email, phone, address) VALUES
(1, 'Good Together', 'Bring the Gold Coast together through small acts of generosity, supporting local food relief, inclusive spaces and a healthier coastline.', 'hello@goodtogether.example', '+61 7 5550 0100', '18 Community Lane, Southport, Gold Coast QLD'),
(2, 'Coast Care Collective', 'Help neighbours care for our coastline and make outdoor community activities accessible to everyone.', 'hello@coastcare.example', '+61 7 5550 0101', '24 Seaside Lane, Burleigh Heads, Gold Coast QLD');

INSERT INTO categories (id, name, description) VALUES
(1, 'Fun run', 'Walk or run together for a local cause.'),
(2, 'Community', 'Neighbourhood gatherings that give back.'),
(3, 'Gala', 'An evening of food, conversation and generosity.'),
(4, 'Workshop', 'Learn something new while making a difference.'),
(5, 'Concert', 'Live performances supporting community projects.'),
(6, 'Auction', 'Find something special and support a good cause.');

-- Dates stay fixed after import; event status is always calculated at request time.
SET @today = CURDATE();

INSERT INTO events (id, organisation_id, category_id, name, summary, purpose, description, starts_at, ends_at, venue, location, address, ticket_price, fundraising_goal, amount_raised, image_path, image_alt, accessibility, publication_status) VALUES
(1, 1, 1, 'Steps for a brighter coast', 'A waterfront 5 km walk and run. Every step helps a neighbour.', 'Fund 1,000 fresh meal packs for Gold Coast households facing food insecurity.', 'Meet your neighbours for an easy-paced morning along the Broadwater. Choose to walk, jog or run the five-kilometre route; this is about showing up, not finishing first. Your ticket supports the Good Together community pantry.\n\nCheck-in opens at 7:00 am beside the parklands kiosk. A volunteer-led warm-up begins at 7:20 am and the walk starts at 7:30 am. Bring a refillable water bottle, a hat and comfortable shoes. Children are welcome with an adult. Water refill points and first-aid volunteers will be available.', TIMESTAMP(DATE_ADD(@today, INTERVAL 9 DAY), '07:30:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 9 DAY), '11:00:00'), 'Broadwater Parklands', 'Southport', 'Marine Parade, Southport QLD', 25, 15000, 9750, '/assets/run.jpg', 'Runners taking part in an outdoor community run', 'Step-free waterfront route, accessible toilets and a quiet rest area.', 'active'),
(2, 1, 2, 'A seat at our table', 'Share a meal and help keep the community pantry stocked.', 'Provide pantry staples and fresh produce for families across Southport.', 'Drop into a welcoming community lunch prepared by local volunteers. Enjoy seasonal food, meet the pantry team and learn how surplus ingredients become meals for neighbours.\n\nThere is no entry fee. Optional donations help restock the pantry, but everyone is welcome to attend. Vegetarian and gluten-free choices are available. Please speak to the kitchen team about allergies before eating.', TIMESTAMP(DATE_ADD(@today, INTERVAL 0 DAY), '00:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 0 DAY), '23:59:59'), 'Neighbourhood House', 'Southport', '18 Community Lane, Southport QLD', 0, 5000, 3250, '/assets/table.jpg', 'People sharing food around a table', 'Step-free entry, accessible toilets and seating at every table.', 'active'),
(3, 1, 3, 'An evening of giving', 'A shared table, a seasonal menu and a cause close to home.', 'Equip a community kitchen with new refrigeration and food preparation equipment.', 'Spend an evening over a three-course seasonal dinner with people who care about their community. Hear from volunteers about the next chapter of our neighbourhood kitchen and enjoy an acoustic set between courses.\n\nThe ticket includes dinner and a welcome soft drink. Doors open at 6:00 pm; dinner starts at 6:30 pm. Smart casual dress is welcome. Dietary requirements can be discussed with the organiser when registration opens.', TIMESTAMP(DATE_ADD(@today, INTERVAL 16 DAY), '18:30:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 16 DAY), '22:00:00'), 'Coastal Community Hall', 'Broadbeach', '12 Community Walk, Broadbeach QLD', 85, 25000, 16250, '/assets/gala.jpg', 'A warmly lit table set for a shared meal', 'Lift access, accessible bathrooms and reserved wheelchair spaces.', 'active'),
(4, 2, 4, 'Grow a little good', 'A hands-on morning of planting, learning and giving back.', 'Create raised garden beds for an accessible neighbourhood food garden.', 'Learn how to grow herbs in a small space, then plant seedlings for the shared garden. Our volunteer gardeners will cover soil preparation, watering and choosing plants for a coastal climate.\n\nAll materials are included and you can take home a small herb pot. Wear closed shoes and bring a hat. The workshop is suitable for beginners and children aged eight and above with an adult.', TIMESTAMP(DATE_ADD(@today, INTERVAL 12 DAY), '09:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 12 DAY), '12:00:00'), 'Community Garden', 'Burleigh Heads', '8 Garden Lane, Burleigh Heads QLD', 15, 4000, 2400, '/assets/garden.jpg', 'Green seedlings ready to be planted', 'Raised work benches, step-free paths and accessible toilets nearby.', 'active'),
(5, 1, 5, 'Music with a purpose', 'Local voices. An open-air stage. A stronger community.', 'Support an after-school music programme for young people.', 'Bring a picnic blanket for an afternoon of acoustic music performed by local musicians. Ticket proceeds help provide instruments and supervised after-school sessions for young people who would otherwise miss out.\n\nGates open thirty minutes before the first performance. Food stalls and free drinking water will be available. This is an alcohol-free event. Children under twelve can attend with an adult at no extra cost.', TIMESTAMP(DATE_ADD(@today, INTERVAL 23 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 23 DAY), '19:00:00'), 'Riverside Green', 'Surfers Paradise', '20 Riverside Walk, Surfers Paradise QLD', 30, 10000, 7100, '/assets/concert.jpg', 'An audience enjoying live music', 'Level viewing area, accessible toilets and a low-sensory seating zone.', 'active'),
(6, 1, 6, 'Second stories, new beginnings', 'Pre-loved treasures and local art, with every bid giving back.', 'Help furnish safe temporary accommodation for local families.', 'Browse donated artworks, restored furniture and carefully chosen vintage pieces. Every winning bid supports essential furnishings for families moving into temporary accommodation.\n\nViewing begins at 10:00 am and the auction starts at 11:00 am. Entry is free and there is no obligation to bid. A volunteer will explain the bidding process before the first lot. Collection arrangements will be discussed with successful bidders.', TIMESTAMP(DATE_ADD(@today, INTERVAL 19 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 19 DAY), '14:00:00'), 'Neighbourhood Hall', 'Southport', '14 Community Lane, Southport QLD', 0, 8000, 4200, '/assets/auction.jpg', 'A collection of books with stories to share', 'Step-free venue, wide aisles and accessible seating.', 'active'),
(7, 2, 2, 'Small acts, cleaner shores', 'An easy beach clean-up followed by a shared morning tea.', 'Supply reusable clean-up equipment and coastal habitat education kits.', 'Join a friendly volunteer team to collect litter along the shoreline and learn how to protect coastal habitats. Gloves and collection bags are provided, with a short safety briefing before we set off.\n\nStay for morning tea and a chat afterwards. Entry is free; optional donations contribute to equipment and educational materials. Wear sun protection and closed shoes. Children must be accompanied by an adult.', TIMESTAMP(DATE_ADD(@today, INTERVAL 30 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 30 DAY), '10:30:00'), 'Beachfront Meeting Point', 'Burleigh Heads', 'The Esplanade, Burleigh Heads QLD', 0, 3000, 1800, '/assets/coast.jpg', 'Waves meeting a sunlit coastline', 'An accessible path-based clean-up option is available beside the beach.', 'active'),
(8, 1, 4, 'Make, mend and give', 'Give your favourite clothes a longer life, together.', 'Purchase sewing kits for free community repair sessions.', 'Learn three useful hand-sewing repairs with patient volunteer makers. Bring one clean item of clothing that needs a small repair, or practise on the provided fabric.\n\nNeedles, thread and basic materials are included in the ticket. No previous sewing experience is needed. Tea and coffee will be available, and you will leave with a pocket guide to the techniques covered.', TIMESTAMP(DATE_ADD(@today, INTERVAL 37 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 37 DAY), '12:30:00'), 'Makers Room', 'Broadbeach', '12 Community Walk, Broadbeach QLD', 12, 2500, 1500, '/assets/auction.jpg', 'A collection of books with stories to share', 'Step-free room, adjustable work tables and large-print handouts.', 'active'),
(9, 2, 1, 'Sunrise for the sea', 'Start the day with a gentle coastal walk for healthier oceans.', 'Fund dune restoration materials and community education sessions.', 'Watch the morning light over the ocean on a guided three-kilometre walk. Volunteers will share the story of local dune restoration and explain how small everyday choices protect marine life.\n\nThe ticket includes a light breakfast at the finish. Bring a water bottle and a light jacket. The group stays together at a comfortable walking pace. Weather updates will be available from the organiser before the event.', TIMESTAMP(DATE_ADD(@today, INTERVAL 44 DAY), '06:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 44 DAY), '09:00:00'), 'Oceanway Lookout', 'Main Beach', 'Seaworld Drive, Main Beach QLD', 20, 6000, 3300, '/assets/coast.jpg', 'Waves meeting a sunlit coastline', 'Paved coastal route with rest stops; contact the organiser for route details.', 'active'),
(10, 1, 5, 'Sunday sounds for good', 'A relaxed afternoon of music supporting local youth spaces.', 'Provide art materials and equipment for a youth drop-in centre.', 'Enjoy small acoustic performances and a community afternoon in the park. Local performers are donating their time to support a youth drop-in centre where young people can connect, create and find support.\n\nBring a blanket or use the available chairs. Refreshments can be purchased on site. The ticket includes all performances and children are welcome with a supervising adult.', TIMESTAMP(DATE_ADD(@today, INTERVAL 51 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 51 DAY), '17:30:00'), 'Riverside Green', 'Surfers Paradise', '20 Riverside Walk, Surfers Paradise QLD', 18, 7000, 3900, '/assets/concert.jpg', 'An audience enjoying live music', 'Step-free entry, accessible seating and nearby public transport.', 'active'),
(11, 1, 1, 'Winter warmth walk', 'A completed community walk supporting winter essentials.', 'Provide warm bedding and clothing to households in need.', 'Neighbours came together for a waterfront walk supporting the winter essentials appeal. Funds from this completed event helped provide warm bedding and clothing.\n\nThis event has ended. Browse upcoming events to find another way to take part.', TIMESTAMP(DATE_ADD(@today, INTERVAL -14 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL -14 DAY), '11:00:00'), 'Broadwater Parklands', 'Southport', 'Marine Parade, Southport QLD', 20, 5000, 5500, '/assets/run.jpg', 'Runners taking part in an outdoor community run', 'Step-free waterfront route.', 'active'),
(12, 1, 3, 'Community gala review', 'An event withheld from public listings pending review.', 'Support local food relief after the event has passed review.', 'This sample event is suspended to demonstrate that unpublished events cannot be discovered through public endpoints.', TIMESTAMP(DATE_ADD(@today, INTERVAL 20 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 20 DAY), '21:00:00'), 'Community Hall', 'Southport', '18 Community Lane, Southport QLD', 60, 10000, 0, '/assets/gala.jpg', 'A warmly lit table set for a shared meal', 'Step-free entry.', 'suspended');
COMMIT;

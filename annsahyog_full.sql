-- MySQL dump 10.13  Distrib 26.7.0, for Win64 (x86_64)
--
-- Host: localhost    Database: annsahyog
-- ------------------------------------------------------
-- Server version	26.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `donation_items`
--

DROP TABLE IF EXISTS `donation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `donation_id` int NOT NULL,
  `food_item` varchar(150) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `donation_id` (`donation_id`),
  CONSTRAINT `donation_items_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`donation_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donation_items`
--

LOCK TABLES `donation_items` WRITE;
/*!40000 ALTER TABLE `donation_items` DISABLE KEYS */;
INSERT INTO `donation_items` VALUES (1,1,'Veg Pulao & Dal',25.00,'plates'),(2,2,'Veg Pulao & Raita',40.00,'plates'),(3,3,'Paneer Sabzi & Rotis',8.00,'kg'),(4,4,'Gujarati Thali (Dal, Bhaat, Shaak, Rotli)',60.00,'plates'),(5,5,'Mohanthal & Kaju Katli',5.00,'kg'),(6,5,'Khaman Dhokla',30.00,'packets'),(7,6,'Chole & Jeera Rice',12.00,'kg'),(8,7,'Packaged Drinking Water',10.00,'boxes'),(9,7,'Bread Loaves',25.00,'pieces');
/*!40000 ALTER TABLE `donation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donation_requests`
--

DROP TABLE IF EXISTS `donation_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `donation_id` int NOT NULL,
  `ngo_id` int NOT NULL,
  `requested_quantity` decimal(10,2) NOT NULL,
  `message` text,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `responded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `donation_id` (`donation_id`),
  KEY `ngo_id` (`ngo_id`),
  CONSTRAINT `donation_requests_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`donation_id`) ON DELETE CASCADE,
  CONSTRAINT `donation_requests_ibfk_2` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`ngo_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donation_requests`
--

LOCK TABLES `donation_requests` WRITE;
/*!40000 ALTER TABLE `donation_requests` DISABLE KEYS */;
INSERT INTO `donation_requests` VALUES (1,1,3,25.00,'We would like to request this food for distribution at our community center.','APPROVED','2026-10-21 21:43:58','2026-10-21 21:44:58'),(2,3,2,8.00,'We would like to request this food for distribution at our community center.','APPROVED','2026-10-21 22:11:24','2026-10-21 22:16:19'),(3,6,5,12.00,'For lunch distribution at our Bapunagar community kitchen.','APPROVED','2026-10-21 22:29:44','2026-10-21 22:32:46'),(4,4,5,60.00,'Will serve dinner to families at our Bapunagar shelter.','APPROVED','2026-10-21 22:29:44','2026-10-21 22:31:10');
/*!40000 ALTER TABLE `donation_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donations`
--

DROP TABLE IF EXISTS `donations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donations` (
  `donation_id` int NOT NULL AUTO_INCREMENT,
  `donor_id` int NOT NULL,
  `food_type` varchar(100) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `description` text,
  `prepared_date` datetime DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `pickup_address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` enum('AVAILABLE','REQUESTED','ACCEPTED','PICKED_UP','DELIVERED','CANCELLED','COMPLETED') DEFAULT 'AVAILABLE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`donation_id`),
  KEY `donor_id` (`donor_id`),
  CONSTRAINT `donations_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`donor_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donations`
--

LOCK TABLES `donations` WRITE;
/*!40000 ALTER TABLE `donations` DISABLE KEYS */;
INSERT INTO `donations` VALUES (1,1,'Veg Pulao & Dal',25.00,'plates','Freshly cooked for an event. Vegetarian. Packed in clean steel containers.','2026-10-22 12:00:00','2026-10-22 21:00:00','LJ Campus, LJ University Rd, off Sarkhej - Gandhinagar Highway, Sarkhej, Ahmedabad, Gujarat 382210, India','Ahmedabad',22.99029510,72.48721430,'DELIVERED','2026-10-21 21:38:28'),(2,2,'Veg Pulao & Raita',40.00,'plates','Freshly cooked vegetarian pulao with raita. Packed in sealed foil containers. No onion/garlic.','2026-10-22 02:30:00','2026-10-22 14:00:00','Law Garden, Ellisbridge, Ahmedabad, Gujarat 380006, India','Ahmedabad',23.02768660,72.55999480,'AVAILABLE','2026-10-21 22:04:06'),(3,2,'Paneer Sabzi & Rotis',8.00,'kg','Surplus from evening event. Paneer sabzi in steel trays, rotis packed separately. Vegetarian.','2026-10-22 03:00:00','2026-10-22 12:00:00','Satellite Rd, Satellite, Ahmedabad, Gujarat 380015, India','Ahmedabad',23.02716350,72.50845870,'ACCEPTED','2026-10-21 22:04:56'),(4,4,'Gujarati Thali (Dal, Bhaat, Shaak, Rotli)',60.00,'plates','Leftover from wedding catering order. Packed in disposable thali boxes. Pure veg.','2026-10-22 01:30:00','2026-10-22 13:00:00','CG Road, Navrangpura, Ahmedabad, Gujarat 380009, India','Ahmedabad',23.03000000,72.55900000,'ACCEPTED','2026-10-21 22:24:20'),(5,4,'Mohanthal & Kaju Katli, Khaman Dhokla',35.00,'mixed','Fresh sweets and farsan surplus. Sealed boxes, keep cool.','2026-10-21 18:00:00','2026-10-23 18:00:00','Stadium Cross Road, Navrangpura, Ahmedabad, Gujarat 380014, India','Ahmedabad',23.03950000,72.56050000,'AVAILABLE','2026-10-21 22:24:20'),(6,5,'Chole & Jeera Rice',12.00,'kg','Breakfast/lunch buffet surplus. Packed in food-grade containers.','2026-10-22 02:00:00','2026-10-22 14:00:00','Kankaria Road, Maninagar, Ahmedabad, Gujarat 380008, India','Ahmedabad',23.00060000,72.60110000,'DELIVERED','2026-10-21 22:24:20'),(7,5,'Packaged Drinking Water, Bread Loaves',35.00,'mixed','Unopened hotel stock near best-before date.','2026-10-21 10:00:00','2026-10-24 10:00:00','Jawahar Chowk, Maninagar, Ahmedabad, Gujarat 380008, India','Ahmedabad',22.99650000,72.60800000,'AVAILABLE','2026-10-21 22:24:20');
/*!40000 ALTER TABLE `donations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donors`
--

DROP TABLE IF EXISTS `donors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donors` (
  `donor_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `organization_name` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`donor_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `donors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donors`
--

LOCK TABLES `donors` WRITE;
/*!40000 ALTER TABLE `donors` DISABLE KEYS */;
INSERT INTO `donors` VALUES (1,5,NULL,NULL,NULL,NULL,NULL),(2,6,NULL,NULL,NULL,NULL,NULL),(4,17,NULL,NULL,NULL,NULL,NULL),(5,18,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `donors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `donation_id` int NOT NULL,
  `comments` varchar(255) DEFAULT NULL,
  `submitted_date` datetime DEFAULT NULL,
  PRIMARY KEY (`feedback_id`),
  KEY `user_id` (`user_id`),
  KEY `donation_id` (`donation_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`donation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ngos`
--

DROP TABLE IF EXISTS `ngos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ngos` (
  `ngo_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `organization_name` varchar(150) NOT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `verification_status` enum('PENDING','ACTIVE','DEACTIVE','REJECTED') DEFAULT 'PENDING',
  PRIMARY KEY (`ngo_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ngos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ngos`
--

LOCK TABLES `ngos` WRITE;
/*!40000 ALTER TABLE `ngos` DISABLE KEYS */;
INSERT INTO `ngos` VALUES (1,2,'Yuva Unstoppable',NULL,'HK House, Ashram Road, Ahmedabad, Gujarat','Ahmedabad',NULL,NULL,'ACTIVE'),(2,3,'Visamo Kids Foundation',NULL,'Nandanpark Society, Bopal, Ahmedabad, Gujarat Website	visamokids.org','Ahmedabad',NULL,NULL,'ACTIVE'),(3,4,'Blind People\'s Association',NULL,'Jagdish Patel Chowk, 132 Ft Ring Road, Vastrapur, Ahmedabad, Gujarat 380015','Ahmedabad',NULL,NULL,'ACTIVE'),(4,19,'Roti Bank Ahmedabad','GUJ/NGO/2019/4521','Vastrapur Lake Road, Vastrapur, Ahmedabad','Ahmedabad',NULL,NULL,'PENDING'),(5,20,'Asha Seva Trust','GUJ/NGO/2021/7788','Bapunagar Main Road, Ahmedabad','Ahmedabad',NULL,NULL,'ACTIVE');
/*!40000 ALTER TABLE `ngos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` varchar(255) NOT NULL,
  `type` enum('DONATION','REQUEST','ASSIGNMENT','DELIVERY') DEFAULT NULL,
  `status` enum('READ','UNREAD') DEFAULT 'UNREAD',
  `created_date` datetime DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,4,'Your NGO profile (Blind People\'s Association) has been approved and is now Active. You can request surplus food.','REQUEST','UNREAD','2026-10-22 02:37:07'),(2,3,'Your NGO profile (Visamo Kids Foundation) has been approved and is now Active. You can request surplus food.','REQUEST','UNREAD','2026-10-22 02:37:16'),(3,5,'New food request from \"Blind People\'s Association\" for 25.00 of \"Veg Pulao & Dal\".','REQUEST','UNREAD','2026-10-22 03:13:58'),(4,6,'New food request from \"Visamo Kids Foundation\" for 8.00 of \"Paneer Sabzi & Rotis\".','REQUEST','UNREAD','2026-10-22 03:41:24'),(5,20,'Your NGO profile (Asha Seva Trust) has been approved and is now Active. You can request surplus food.','REQUEST','UNREAD','2026-10-22 03:58:52'),(6,2,'Your NGO profile (Yuva Unstoppable) has been approved and is now Active. You can request surplus food.','REQUEST','UNREAD','2026-10-22 03:58:57'),(7,18,'New food request from \"Asha Seva Trust\" for 12 of \"Chole & Jeera Rice\".','REQUEST','UNREAD','2026-10-22 03:59:44'),(8,17,'New food request from \"Asha Seva Trust\" for 60 of \"Gujarati Thali (Dal, Bhaat, Shaak, Rotli)\".','REQUEST','UNREAD','2026-10-22 03:59:44');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pickup_delivery`
--

DROP TABLE IF EXISTS `pickup_delivery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pickup_delivery` (
  `pickup_id` int NOT NULL AUTO_INCREMENT,
  `donation_id` int NOT NULL,
  `volunteer_id` int DEFAULT NULL,
  `pickup_location` varchar(255) DEFAULT NULL,
  `delivery_location` varchar(255) DEFAULT NULL,
  `status` enum('ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED') DEFAULT 'ASSIGNED',
  `pickup_timestamp` datetime DEFAULT NULL,
  `delivery_timestamp` datetime DEFAULT NULL,
  `pickup_latitude` decimal(10,8) DEFAULT NULL,
  `pickup_longitude` decimal(11,8) DEFAULT NULL,
  `delivery_latitude` decimal(10,8) DEFAULT NULL,
  `delivery_longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`pickup_id`),
  KEY `donation_id` (`donation_id`),
  KEY `volunteer_id` (`volunteer_id`),
  CONSTRAINT `pickup_delivery_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`donation_id`),
  CONSTRAINT `pickup_delivery_ibfk_2` FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers` (`volunteer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pickup_delivery`
--

LOCK TABLES `pickup_delivery` WRITE;
/*!40000 ALTER TABLE `pickup_delivery` DISABLE KEYS */;
INSERT INTO `pickup_delivery` VALUES (1,1,1,'LJ Campus, LJ University Rd, off Sarkhej - Gandhinagar Highway, Sarkhej, Ahmedabad, Gujarat 382210, India, Ahmedabad','Blind People\'s Association, Jagdish Patel Chowk, 132 Ft Ring Road, Vastrapur, Ahmedabad, Gujarat 380015, Ahmedabad','DELIVERED','2026-10-22 03:16:50','2026-10-22 03:17:19',22.99029510,72.48721430,NULL,NULL),(2,3,3,'Satellite Rd, Satellite, Ahmedabad, Gujarat 380015, India, Ahmedabad','Visamo Kids Foundation, Nandanpark Society, Bopal, Ahmedabad, Gujarat Website	visamokids.org, Ahmedabad','ASSIGNED',NULL,NULL,23.02716350,72.50845870,NULL,NULL),(3,4,1,'CG Road, Navrangpura, Ahmedabad, Gujarat 380009, India, Ahmedabad','Asha Seva Trust, Bapunagar Main Road, Ahmedabad, Ahmedabad','ASSIGNED',NULL,NULL,23.03000000,72.55900000,NULL,NULL),(4,6,2,'Kankaria Road, Maninagar, Ahmedabad, Gujarat 380008, India, Ahmedabad','Asha Seva Trust, Bapunagar Main Road, Ahmedabad, Ahmedabad','DELIVERED','2026-10-22 04:05:06','2026-10-22 04:05:40',23.00060000,72.60110000,NULL,NULL);
/*!40000 ALTER TABLE `pickup_delivery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role` enum('ADMIN','DONOR','NGO','VOLUNTEER') NOT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Platform Administrator','admin@annsahyog.org','$2b$10$CKvuiMoseUrM0eBVo/K0teBoD9IABHdMZbVtSrYmnlP2hIGXel.Fu','','ADMIN','ACTIVE','2026-10-21 15:57:11','2026-10-21 15:57:11'),(2,'Yuva Unstoppable','info@yuvaunstoppable.org','$2b$10$iZSMLLgDaY35MefJznISpOIwZtbMl6vnSyRXTHQqPgTMERlx3gDBG','7600801762','NGO','ACTIVE','2026-10-21 17:38:44','2026-10-21 17:38:44'),(3,'Visamo Kids Foundation','supervisor.visamo@kalorex.org','$2b$10$91kO72Vr5V4aWwFPEqEYjOR0Zja6C1LG6Wn4st1uzF602z/iSeBFC','8155099959','NGO','ACTIVE','2026-10-21 18:42:04','2026-10-21 18:42:04'),(4,'Blind People\'s Association','gensecbpa@gmail.com','$2b$10$r6xPTILxB68oN5cedlEy7euXlRGjFQhtEPbLYrvzCd80GjExegfBm','26304070','NGO','ACTIVE','2026-10-21 18:45:12','2026-10-21 18:45:12'),(5,'Shreenathaji Caterers','shreenathaji.demo@gmail.com','$2b$10$BjkhA.BczzAtWJ7VZNAEUeWBd8vEnwN2/aZ.12UYJDDoI77o6qOq6','9825941009','DONOR','ACTIVE','2026-10-21 18:48:36','2026-10-21 18:48:36'),(6,'TGS – The Great Spoon Catering','tgs.demo@gmail.com','$2b$10$UyQI/wjs36MX1.sZGCOQeeYsxl.IXfCYmb1TN1IpWL84eKlmmJWF2','9714147482','DONOR','ACTIVE','2026-10-21 18:51:19','2026-10-21 18:51:19'),(7,'Aarav Patel','aaravpatel@gmail.com','$2b$10$27NipBUVaUeIstT58.r0Q.Grb5RnlXPLo5hXuQwPNa14TQVjDh32u','9000000101','VOLUNTEER','ACTIVE','2026-10-21 18:53:19','2026-10-21 18:53:19'),(8,'Rohan Mehta','rohan@gmail.com','$2b$10$iK1jXgEdWd0HC3PetftW4ebNZVV6fxigUKeEHCOzqVvmIqNMH.v56','9000000103','VOLUNTEER','ACTIVE','2026-10-21 18:56:49','2026-10-21 18:56:49'),(9,'Vedaxi Godavale','vedaxig@gmail.com','$2b$10$lBtDgFWDew7jL/PNMT3HOOliBWoC3MpfoRFo4k2KE8.SoSm38cMXm','9845674520','VOLUNTEER','ACTIVE','2026-10-21 19:02:18','2026-10-21 19:02:18'),(17,'Rajbhog Sweets & Caterers','rajbhog.donor@annsahyog.test','$2b$10$RZ774SIb4sEdX9sG2Yg4qeYSZmsLyWd/GFRi3PqkcBCrBud/DIsu2','9825011001','DONOR','ACTIVE','2026-10-21 22:23:59','2026-10-21 22:23:59'),(18,'Hotel Shivam Residency','shivam.donor@annsahyog.test','$2b$10$.4EvalcMP01Yh6w8k3aMF.Rzgpvw5QxqexAoL6RD3OoUWNNjEFp3C','9825011002','DONOR','ACTIVE','2026-10-21 22:23:59','2026-10-21 22:23:59'),(19,'Roti Bank Ahmedabad','rotibank.ngo@annsahyog.test','$2b$10$rUhI66Et/dr7JGGud.wxfubpbDz1D/Zzxum4rhoDsFMujladCrt5i','9825011003','NGO','ACTIVE','2026-10-21 22:23:59','2026-10-21 22:23:59'),(20,'Asha Seva Trust','ashaseva.ngo@annsahyog.test','$2b$10$cFyXwdp04.6nSJ/wmHdRQegfFM6xtPTg5vMOhteZSlKNvxjbcrbca','9825011004','NGO','ACTIVE','2026-10-21 22:23:59','2026-10-21 22:23:59'),(21,'Kunal Patel','kunal.volunteer@annsahyog.test','$2b$10$CekHh/DFNtxQb1SCdnLDnOvMomaVXuBV6h6AYkBYBcmqQkXdWU4bW','9825011005','VOLUNTEER','ACTIVE','2026-10-21 22:24:00','2026-10-21 22:24:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `volunteers`
--

DROP TABLE IF EXISTS `volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `volunteers` (
  `volunteer_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `availability` enum('AVAILABLE','UNAVAILABLE') DEFAULT 'AVAILABLE',
  PRIMARY KEY (`volunteer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `volunteers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `volunteers`
--

LOCK TABLES `volunteers` WRITE;
/*!40000 ALTER TABLE `volunteers` DISABLE KEYS */;
INSERT INTO `volunteers` VALUES (1,7,'102, Shivalik Plaza, C.G. Road','Ahmedabad',NULL,NULL,'AVAILABLE'),(2,8,NULL,'Ahmedabad',NULL,NULL,'AVAILABLE'),(3,9,'Kalash Enclave, Vatva -Naring tin','Ahmedabad',NULL,NULL,'AVAILABLE'),(4,21,'Judges Bungalow Road, Bodakdev, Ahmedabad','Ahmedabad',NULL,NULL,'AVAILABLE');
/*!40000 ALTER TABLE `volunteers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'annsahyog'
--

--
-- Dumping routines for database 'annsahyog'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-22 20:42:14

ALTER TABLE `visual_projects` ADD `origin` enum('blank','folder','github') DEFAULT 'blank' NOT NULL;--> statement-breakpoint
ALTER TABLE `visual_projects` ADD `detectedFramework` enum('html','vue','react','svelte','unknown') DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `visual_projects` ADD `sourceUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `visual_projects` ADD `importedFiles` text;
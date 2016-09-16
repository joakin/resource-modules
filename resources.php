<?php
define('MEDIAWIKI', true);
$IP = $argv[1];
$FILE = $argv[2];
require_once("$IP/includes/AutoLoader.php");
require_once("$IP/includes/Defines.php");
require_once("$IP/includes/DefaultSettings.php");
require_once("$IP/includes/GlobalFunctions.php");
if ( is_readable( "$IP/vendor/autoload.php" ) ) {
	require_once("$IP/vendor/autoload.php");
}

echo(json_encode(include("$IP$FILE"), JSON_PRETTY_PRINT));

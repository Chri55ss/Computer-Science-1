Clear-Host

Write-Host "=== THE GARGOYLE PLEDGE INCIDENT ===" -ForegroundColor Cyan
Write-Host ""

$officer1 = Read-Host "Officer 1 Name"
$officer2 = Read-Host "Officer 2 Name"
$frat = Read-Host "Fraternity Name"
$animal = Read-Host "Animal"
$food = Read-Host "Food"
$clothing = Read-Host "Piece of Clothing"
$president = Read-Host "President's Name"
$verb = Read-Host "Verb ending in -ing"
$object = Read-Host "Object"
$color = Read-Host "Color"
$bodypart = Read-Host "Body Part"
$day = Read-Host "Day of the Week"

Write-Host ""
Write-Host "Dispatching officers..." -ForegroundColor Yellow
Start-Sleep 2

$story = @"

Officer $officer1 and their partner, Officer $officer2, were on call on a Friday night when 911 received a mysterious report from the $frat house.

The caller claimed there was a hazing incident involving a $animal, several members, and an alarming quantity of $food.

The officers arrived and cautiously entered the basement.

Inside, two men were fully clothed while everyone else was wearing only $clothing.

Officer $officer1 blinked.

Officer $officer2 blinked.

Neither officer had been trained for this.

"What exactly is happening here?" asked $officer1.

The fraternity president, $president, immediately replied:

"I have absolutely no idea. I was busy $verb."

The officers were not convinced.

After a brief discussion, they entered a nearby room.

Sitting perfectly still on a $object was a man painted entirely $color.

His posture was impossible.

His expression never changed.

He looked exactly like a gargoyle.

The room became silent.

Officer $officer2 cautiously stepped forward.

"Are you the Gargoyle Pledge?" they asked.

The figure slowly turned his head.

After a dramatic pause, he replied:

"No."

"This is just my $bodypart."

Someone dropped a plate of $food.

Someone else whispered:

"That's somehow more concerning."

The officers stared.

The Gargoyle stared back.

Nobody moved.

After what felt like three business days, Officer $officer1 sighed.

"Well," they said, "this is definitely the strangest $day of my career."

The Gargoyle nodded once.

The case was closed.

Sort of.

THE END

"@

Write-Host ""
Write-Host $story -ForegroundColor Green

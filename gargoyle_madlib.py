import time

print("=== THE GARGOYLE PLEDGE INCIDENT ===")
print()

def get_input(prompt):
    while True:
        value = input(prompt).strip()  # string method used
        if value:                      # validation
            return value
        print("Input cannot be blank.")

officer1 = get_input("Officer 1 Name: ")
officer2 = get_input("Officer 2 Name: ")
president = get_input("Fraternity President: ")
clothing = get_input("Piece of clothing: ")
object_name = get_input("Object to sit on: ")
color = get_input("Color: ")
food = get_input("Food: ")

print("\nDispatching officers...")
time.sleep(1)

story = f"""
Officer {officer1} and their partner, Officer {officer2}, were on call on a Friday night when a mysterious subject called 911 regarding a fraternity hazing incident.

The officers arrived and entered the basement.

Inside, two men were fully clothed while the others were wearing only {clothing}.

"What is going on here?" asked Officer {officer1}.

The fraternity president, {president}, shrugged.

"I have absolutely no idea."

The officers looked around suspiciously.

They entered another room to discuss the situation.

Suddenly they noticed a man perched on a {object_name}.

He was painted entirely {color}.

He sat perfectly still.

His posture resembled a gargoyle watching over an ancient cathedral.

Officer {officer2} slowly approached.

"Are you the Gargoyle Pledge?" they asked.

The figure turned his head.

After an awkward pause he replied:

"No."

"This is just my skin."

The room fell silent.

Someone dropped a plate of {food}.

Someone whispered:

"That's somehow worse."

The officers looked at each other.

The gargoyle remained motionless.

Nobody knew what to say.

The case remains one of the strangest incidents in local history.

THE END
"""

print(story)
input("Press Enter to exit...")

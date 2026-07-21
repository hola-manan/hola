// Curated exercise catalog seeded from free-exercise-db (public domain).
// https://github.com/yuhonas/free-exercise-db — regenerate via scripts/curate.mjs
import type { Exercise } from '../types'

export const EXERCISES: Exercise[] = [
  {
    "id": "bench-press-barbell",
    "name": "Bench Press (Barbell)",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts",
      "triceps"
    ],
    "equipment": "barbell",
    "instructions": [
      "Lie back on a flat bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
      "From the starting position, breathe in and begin coming down slowly until the bar touches your middle chest.",
      "After a brief pause, push the bar back to the starting position as you breathe out. Focus on pushing the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position at the top of the motion, hold for a second and then start coming down slowly again. Tip: Ideally, lowering the weight should take about twice as long as raising it.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the bar back in the rack."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg"
    ]
  },
  {
    "id": "incline-bench-press-barbell",
    "name": "Incline Bench Press (Barbell)",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts",
      "triceps"
    ],
    "equipment": "barbell",
    "instructions": [
      "Lie back on an incline bench. Using a medium-width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
      "As you breathe in, come down slowly until you feel the bar on you upper chest.",
      "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly again. Tip: it should take at least twice as long to go down than to come up.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the bar back in the rack."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/1.jpg"
    ]
  },
  {
    "id": "decline-bench-press-barbell",
    "name": "Decline Bench Press (Barbell)",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts",
      "triceps"
    ],
    "equipment": "barbell",
    "instructions": [
      "Secure your legs at the end of the decline bench and slowly lay down on the bench.",
      "Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. The arms should be perpendicular to the floor. This will be your starting position. Tip: In order to protect your rotator cuff, it is best if you have a spotter help you lift the barbell off the rack.",
      "As you breathe in, come down slowly until you feel the bar on your lower chest.",
      "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up).",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the bar back in the rack."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/1.jpg"
    ]
  },
  {
    "id": "bench-press-dumbbell",
    "name": "Bench Press (Dumbbell)",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts",
      "triceps"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs. The palms of your hands will be facing each other.",
      "Then, using your thighs to help raise the dumbbells up, lift the dumbbells one at a time so that you can hold them in front of you at shoulder width.",
      "Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. The dumbbells should be just to the sides of your chest, with your upper arm and forearm creating a 90 degree angle. Be sure to maintain full control of the dumbbells at all times. This will be your starting position.",
      "Then, as you breathe out, use your chest to push the dumbbells up. Lock your arms at the top of the lift and squeeze your chest, hold for a second and then begin coming down slowly. Tip: Ideally, lowering the weight should take about twice as long as raising it.",
      "Repeat the movement for the prescribed amount of repetitions of your training program."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/1.jpg"
    ]
  },
  {
    "id": "incline-bench-press-dumbbell",
    "name": "Incline Bench Press (Dumbbell)",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts",
      "triceps"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Lie back on an incline bench with a dumbbell in each hand atop your thighs. The palms of your hands will be facing each other.",
      "Then, using your thighs to help push the dumbbells up, lift the dumbbells one at a time so that you can hold them at shoulder width.",
      "Once you have the dumbbells raised to shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.",
      "Be sure to keep full control of the dumbbells at all times. Then breathe out and push the dumbbells up with your chest.",
      "Lock your arms at the top, hold for a second, and then start slowly lowering the weight. Tip Ideally, lowering the weights should take about twice as long as raising them.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the dumbbells back on your thighs and then on the floor. This is the safest manner to release the dumbbells."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/1.jpg"
    ]
  },
  {
    "id": "dumbbell-fly",
    "name": "Dumbbell Fly",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [],
    "equipment": "dumbbell",
    "instructions": [
      "Lie down on a flat bench with a dumbbell on each hand resting on top of your thighs. The palms of your hand will be facing each other.",
      "Then using your thighs to help raise the dumbbells, lift the dumbbells one at a time so you can hold them in front of you at shoulder width with the palms of your hands facing each other. Raise the dumbbells up like you're pressing them, but stop and hold just before you lock out. This will be your starting position.",
      "With a slight bend on your elbows in order to prevent stress at the biceps tendon, lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary; the movement should only occur at the shoulder joint.",
      "Return your arms back to the starting position as you squeeze your chest muscles and breathe out. Tip: Make sure to use the same arc of motion used to lower the weights.",
      "Hold for a second at the contracted position and repeat the movement for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/1.jpg"
    ]
  },
  {
    "id": "incline-dumbbell-fly",
    "name": "Incline Dumbbell Fly",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Hold a dumbbell on each hand and lie on an incline bench that is set to an incline angle of no more than 30 degrees.",
      "Extend your arms above you with a slight bend at the elbows.",
      "Now rotate the wrists so that the palms of your hands are facing you. Tip: The pinky fingers should be next to each other. This will be your starting position.",
      "As you breathe in, start to slowly lower the arms to the side while keeping the arms extended and while rotating the wrists until the palms of the hand are facing each other. Tip: At the end of the movement the arms will be by your side with the palms facing the ceiling.",
      "As you exhale start to bring the dumbbells back up to the starting position by reversing the motion and rotating the hands so that the pinky fingers are next to each other again. Tip: Keep in mind that the movement will only happen at the shoulder joint and at the wrist. There is no motion that happens at the elbow joint.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Flyes/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Flyes/1.jpg"
    ]
  },
  {
    "id": "pec-deck-machine-fly",
    "name": "Pec Deck / Machine Fly",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [],
    "equipment": "machine",
    "instructions": [
      "Sit on the machine with your back flat on the pad.",
      "Take hold of the handles. Tip: Your upper arms should be positioned parallel to the floor; adjust the machine accordingly. This will be your starting position.",
      "Push the handles together slowly as you squeeze your chest in the middle. Breathe out during this part of the motion and hold the contraction for a second.",
      "Return back to the starting position slowly as you inhale until your chest muscles are fully stretched.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly/1.jpg"
    ]
  },
  {
    "id": "cable-crossover",
    "name": "Cable Crossover",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts"
    ],
    "equipment": "cable",
    "instructions": [
      "To get yourself into the starting position, place the pulleys on a high position (above your head), select the resistance to be used and hold the pulleys in each hand.",
      "Step forward in front of an imaginary straight line between both pulleys while pulling your arms together in front of you. Your torso should have a small forward bend from the waist. This will be your starting position.",
      "With a slight bend on your elbows in order to prevent stress at the biceps tendon, extend your arms to the side (straight out at both sides) in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms and torso should remain stationary; the movement should only occur at the shoulder joint.",
      "Return your arms back to the starting position as you breathe out. Make sure to use the same arc of motion used to lower the weights.",
      "Hold for a second at the starting position and repeat the movement for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/1.jpg"
    ]
  },
  {
    "id": "push-up",
    "name": "Push-Up",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts",
      "triceps"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.",
      "Next, lower yourself downward until your chest almost touches the floor as you inhale.",
      "Now breathe out and press your upper body back up to the starting position while squeezing your chest.",
      "After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/1.jpg"
    ]
  },
  {
    "id": "chest-dip",
    "name": "Chest Dip",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts",
      "triceps"
    ],
    "equipment": "other",
    "instructions": [
      "For this exercise you will need access to parallel bars. To get yourself into the starting position, hold your body at arms length (arms locked) above the bars.",
      "While breathing in, lower yourself slowly with your torso leaning forward around 30 degrees or so and your elbows flared out slightly until you feel a slight stretch in the chest.",
      "Once you feel the stretch, use your chest to bring your body back to the starting position as you breathe out. Tip: Remember to squeeze the chest at the top of the movement for a second.",
      "Repeat the movement for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Chest_Version/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Chest_Version/1.jpg"
    ]
  },
  {
    "id": "overhead-press-barbell",
    "name": "Overhead Press (Barbell)",
    "primaryMuscles": [
      "front delts"
    ],
    "secondaryMuscles": [
      "chest",
      "triceps"
    ],
    "equipment": "barbell",
    "instructions": [
      "Sit on a bench with back support in a squat rack. Position a barbell at a height that is just above your head. Grab the barbell with a pronated grip (palms facing forward).",
      "Once you pick up the barbell with the correct grip width, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.",
      "Lower the bar down to the shoulders slowly as you inhale.",
      "Lift the bar back up to the starting position as you exhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shoulder_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shoulder_Press/1.jpg"
    ]
  },
  {
    "id": "overhead-press-dumbbell",
    "name": "Overhead Press (Dumbbell)",
    "primaryMuscles": [
      "front delts"
    ],
    "secondaryMuscles": [
      "triceps"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "While holding a dumbbell in each hand, sit on a military press bench or utility bench that has back support. Place the dumbbells upright on top of your thighs.",
      "Now raise the dumbbells to shoulder height one at a time using your thighs to help propel them up into position.",
      "Make sure to rotate your wrists so that the palms of your hands are facing forward. This is your starting position.",
      "Now, exhale and push the dumbbells upward until they touch at the top.",
      "Then, after a brief pause at the top contracted position, slowly lower the weights back down to the starting position while inhaling.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/1.jpg"
    ]
  },
  {
    "id": "arnold-press",
    "name": "Arnold Press",
    "primaryMuscles": [
      "front delts"
    ],
    "secondaryMuscles": [
      "triceps"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Sit on an exercise bench with back support and hold two dumbbells in front of you at about upper chest level with your palms facing your body and your elbows bent. Tip: Your arms should be next to your torso. The starting position should look like the contracted portion of a dumbbell curl.",
      "Now to perform the movement, raise the dumbbells as you rotate the palms of your hands until they are facing forward.",
      "Continue lifting the dumbbells until your arms are extended above you in straight arm position. Breathe out as you perform this portion of the movement.",
      "After a second pause at the top, begin to lower the dumbbells to the original position by rotating the palms of your hands towards you. Tip: The left arm will be rotated in a counter clockwise manner while the right one will be rotated clockwise. Breathe in as you perform this portion of the movement.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/1.jpg"
    ]
  },
  {
    "id": "lateral-raise",
    "name": "Lateral Raise",
    "primaryMuscles": [
      "side delts"
    ],
    "secondaryMuscles": [],
    "equipment": "dumbbell",
    "instructions": [
      "Pick a couple of dumbbells and stand with a straight torso and the dumbbells by your side at arms length with the palms of the hand facing you. This will be your starting position.",
      "While maintaining the torso in a stationary position (no swinging), lift the dumbbells to your side with a slight bend on the elbow and the hands slightly tilted forward as if pouring water in a glass. Continue to go up until you arms are parallel to the floor. Exhale as you execute this movement and pause for a second at the top.",
      "Lower the dumbbells back down slowly to the starting position as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/1.jpg"
    ]
  },
  {
    "id": "cable-lateral-raise",
    "name": "Cable Lateral Raise",
    "primaryMuscles": [
      "side delts"
    ],
    "secondaryMuscles": [
      "upper back",
      "traps"
    ],
    "equipment": "cable",
    "instructions": [
      "Stand in the middle of two low pulleys that are opposite to each other and place a flat bench right behind you (in perpendicular fashion to you; the narrow edge of the bench should be the one behind you). Select the weight to be used on each pulley.",
      "Now sit at the edge of the flat bench behind you with your feet placed in front of your knees.",
      "Bend forward while keeping your back flat and rest your torso on the thighs.",
      "Have someone give you the single handles attached to the pulleys. Grasp the left pulley with the right hand and the right pulley with the left after you select your weight. The pulleys should run under your knees and your arms will be extended with palms facing each other and a slight bend at the elbows. This will be the starting position.",
      "While keeping the arms stationary, raise the upper arms to the sides until they are parallel to the floor and at shoulder height. Exhale during the execution of this movement and hold the contraction for a second.",
      "Slowly lower your arms to the starting position as you inhale.",
      "Repeat for the recommended amount of repetitions. Tip: Maintain upper arms perpendicular to torso and a fixed elbow position (10 degree to 30 degree angle) throughout exercise."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Seated_Lateral_Raise/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Seated_Lateral_Raise/1.jpg"
    ]
  },
  {
    "id": "front-raise",
    "name": "Front Raise",
    "primaryMuscles": [
      "front delts"
    ],
    "secondaryMuscles": [],
    "equipment": "dumbbell",
    "instructions": [
      "Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs. This will be your starting position.",
      "While maintaining the torso stationary (no swinging), lift the left dumbbell to the front with a slight bend on the elbow and the palms of the hands always facing down. Continue to go up until you arm is slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top. Inhale after the second pause.",
      "Now lower the dumbbell back down slowly to the starting position as you simultaneously lift the right dumbbell.",
      "Continue alternating in this fashion until all of the recommended amount of repetitions have been performed for each arm."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Dumbbell_Raise/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Dumbbell_Raise/1.jpg"
    ]
  },
  {
    "id": "rear-delt-fly-dumbbell",
    "name": "Rear Delt Fly (Dumbbell)",
    "primaryMuscles": [
      "rear delts"
    ],
    "secondaryMuscles": [],
    "equipment": "dumbbell",
    "instructions": [
      "To begin, lie down on an incline bench with the chest and stomach pressing against the incline. Have the dumbbells in each hand with the palms facing each other (neutral grip).",
      "Extend the arms in front of you so that they are perpendicular to the angle of the bench. The legs should be stationary while applying pressure with the ball of your toes. This is the starting position.",
      "Maintaining the slight bend of the elbows, move the weights out and away from each other (to the side) in an arc motion while exhaling. Tip: Try to squeeze your shoulder blades together to get the best results from this exercise.",
      "The arms should be elevated until they are parallel to the floor.",
      "Feel the contraction and slowly lower the weights back down to the starting position while inhaling.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Flyes/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Flyes/1.jpg"
    ]
  },
  {
    "id": "rear-delt-fly-cable",
    "name": "Rear Delt Fly (Cable)",
    "primaryMuscles": [
      "rear delts"
    ],
    "secondaryMuscles": [],
    "equipment": "cable",
    "instructions": [
      "Adjust the pulleys to the appropriate height and adjust the weight. The pulleys should be above your head.",
      "Grab the left pulley with your right hand and the right pulley with your left hand, crossing them in front of you. This will be your starting position.",
      "Initiate the movement by moving your arms back and outward, keeping your arms straight as you execute the movement.",
      "Pause at the end of the motion before returning the handles to the start position."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rear_Delt_Fly/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rear_Delt_Fly/1.jpg"
    ]
  },
  {
    "id": "face-pull",
    "name": "Face Pull",
    "primaryMuscles": [
      "rear delts"
    ],
    "secondaryMuscles": [
      "upper back"
    ],
    "equipment": "cable",
    "instructions": [
      "Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/1.jpg"
    ]
  },
  {
    "id": "upright-row",
    "name": "Upright Row",
    "primaryMuscles": [
      "side delts"
    ],
    "secondaryMuscles": [
      "traps"
    ],
    "equipment": "barbell",
    "instructions": [
      "Grasp a barbell with an overhand grip that is slightly less than shoulder width. The bar should be resting on the top of your thighs with your arms extended and a slight bend in your elbows. Your back should also be straight. This will be your starting position.",
      "Now exhale and use the sides of your shoulders to lift the bar, raising your elbows up and to the side. Keep the bar close to your body as you raise it. Continue to lift the bar until it nearly touches your chin. Tip: Your elbows should drive the motion, and should always be higher than your forearms. Remember to keep your torso stationary and pause for a second at the top of the movement.",
      "Lower the bar back down slowly to the starting position. Inhale as you perform this portion of the movement.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Upright_Barbell_Row/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Upright_Barbell_Row/1.jpg"
    ]
  },
  {
    "id": "deadlift",
    "name": "Deadlift",
    "primaryMuscles": [
      "lower back"
    ],
    "secondaryMuscles": [
      "calves",
      "forearms",
      "glutes",
      "hamstrings",
      "lats",
      "upper back",
      "quads",
      "traps"
    ],
    "equipment": "barbell",
    "instructions": [
      "Stand in front of a loaded barbell.",
      "While keeping the back as straight as possible, bend your knees, bend forward and grasp the bar using a medium (shoulder width) overhand grip. This will be the starting position of the exercise. Tip: If it is difficult to hold on to the bar with this grip, alternate your grip or use wrist straps.",
      "While holding the bar, start the lift by pushing with your legs while simultaneously getting your torso to the upright position as you breathe out. In the upright position, stick your chest out and contract the back by bringing the shoulder blades back. Think of how the soldiers in the military look when they are in standing in attention.",
      "Go back to the starting position by bending at the knees while simultaneously leaning the torso forward at the waist while keeping the back straight. When the weights on the bar touch the floor you are back at the starting position and ready to perform another repetition.",
      "Perform the amount of repetitions prescribed in the program."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/1.jpg"
    ]
  },
  {
    "id": "romanian-deadlift",
    "name": "Romanian Deadlift",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "lower back"
    ],
    "equipment": "barbell",
    "instructions": [
      "Put a barbell in front of you on the ground and grab it using a pronated (palms facing down) grip that a little wider than shoulder width. Tip: Depending on the weight used, you may need wrist wraps to perform the exercise and also a raised platform in order to allow for better range of motion.",
      "Bend the knees slightly and keep the shins vertical, hips back and back straight. This will be your starting position.",
      "Keeping your back and arms completely straight at all times, use your hips to lift the bar as you exhale. Tip: The movement should not be fast but steady and under control.",
      "Once you are standing completely straight up, lower the bar by pushing the hips back, only slightly bending the knees, unlike when squatting. Tip: Take a deep breath at the start of the movement and keep your chest up. Hold your breath as you lower and exhale as you complete the movement.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/1.jpg"
    ]
  },
  {
    "id": "sumo-deadlift",
    "name": "Sumo Deadlift",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "quads",
      "forearms",
      "glutes",
      "lower back",
      "upper back",
      "traps"
    ],
    "equipment": "barbell",
    "instructions": [
      "Begin with a bar loaded on the ground. Approach the bar so that the bar intersects the middle of the feet. The feet should be set very wide, near the collars. Bend at the hips to grip the bar. The arms should be directly below the shoulders, inside the legs, and you can use a pronated grip, a mixed grip, or hook grip. Relax the shoulders, which in effect lengthens your arms.",
      "Take a breath, and then lower your hips, looking forward with your head with your chest up. Drive through the floor, spreading your feet apart, with your weight on the back half of your feet. Extend through the hips and knees.",
      "As the bar passes through the knees, lean back and drive the hips into the bar, pulling your shoulder blades together.",
      "Return the weight to the ground by bending at the hips and controlling the weight on the way down."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Sumo_Deadlift/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Sumo_Deadlift/1.jpg"
    ]
  },
  {
    "id": "stiff-legged-deadlift",
    "name": "Stiff-Legged Deadlift",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "glutes",
      "lower back"
    ],
    "equipment": "barbell",
    "instructions": [
      "Grasp a bar using an overhand grip (palms facing down). You may need some wrist wraps if using a significant amount of weight.",
      "Stand with your torso straight and your legs spaced using a shoulder width or narrower stance. The knees should be slightly bent. This is your starting position.",
      "Keeping the knees stationary, lower the barbell to over the top of your feet by bending at the hips while keeping your back straight. Keep moving forward as if you were going to pick something from the floor until you feel a stretch on the hamstrings. Inhale as you perform this movement.",
      "Start bringing your torso up straight again by extending your hips until you are back at the starting position. Exhale as you perform this movement.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff-Legged_Barbell_Deadlift/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff-Legged_Barbell_Deadlift/1.jpg"
    ]
  },
  {
    "id": "bent-over-row-barbell",
    "name": "Bent Over Row (Barbell)",
    "primaryMuscles": [
      "upper back"
    ],
    "secondaryMuscles": [
      "biceps",
      "lats",
      "front delts"
    ],
    "equipment": "barbell",
    "instructions": [
      "Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.",
      "Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause.",
      "Then inhale and slowly lower the barbell back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/1.jpg"
    ]
  },
  {
    "id": "one-arm-dumbbell-row",
    "name": "One-Arm Dumbbell Row",
    "primaryMuscles": [
      "upper back"
    ],
    "secondaryMuscles": [
      "biceps",
      "lats",
      "front delts"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Choose a flat bench and place a dumbbell on each side of it.",
      "Place the right leg on top of the end of the bench, bend your torso forward from the waist until your upper body is parallel to the floor, and place your right hand on the other end of the bench for support.",
      "Use the left hand to pick up the dumbbell on the floor and hold the weight while keeping your lower back straight. The palm of the hand should be facing your torso. This will be your starting position.",
      "Pull the resistance straight up to the side of your chest, keeping your upper arm close to your side and keeping the torso stationary. Breathe out as you perform this step. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. Also, make sure that the force is performed with the back muscles and not the arms. Finally, the upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the dumbbell; therefore do not try to pull the dumbbell up using the forearms.",
      "Lower the resistance straight down to the starting position. Breathe in as you perform this step.",
      "Repeat the movement for the specified amount of repetitions.",
      "Switch sides and repeat again with the other arm."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/1.jpg"
    ]
  },
  {
    "id": "pull-up",
    "name": "Pull-Up",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [
      "biceps",
      "upper back"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "Grab the pull-up bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.",
      "As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
      "Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.",
      "After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.",
      "Repeat this motion for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/1.jpg"
    ]
  },
  {
    "id": "chin-up",
    "name": "Chin-Up",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "upper back"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "Grab the pull-up bar with the palms facing your torso and a grip closer than the shoulder width.",
      "As you have both arms extended in front of you holding the bar at the chosen grip width, keep your torso as straight as possible while creating a curvature on your lower back and sticking your chest out. This is your starting position. Tip: Keeping the torso as straight as possible maximizes biceps stimulation while minimizing back involvement.",
      "As you breathe out, pull your torso up until your head is around the level of the pull-up bar. Concentrate on using the biceps muscles in order to perform the movement. Keep the elbows close to your body. Tip: The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.",
      "After a second of squeezing the biceps in the contracted position, slowly lower your torso back to the starting position; when your arms are fully extended. Breathe in as you perform this portion of the movement.",
      "Repeat this motion for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin-Up/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin-Up/1.jpg"
    ]
  },
  {
    "id": "lat-pulldown-wide-grip",
    "name": "Lat Pulldown (Wide Grip)",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [
      "biceps",
      "upper back",
      "front delts"
    ],
    "equipment": "cable",
    "instructions": [
      "Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.",
      "Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.",
      "As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
      "As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the bar; therefore do not try to pull down the bar using the forearms.",
      "After a second at the contracted position squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.",
      "Repeat this motion for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/1.jpg"
    ]
  },
  {
    "id": "lat-pulldown-close-grip",
    "name": "Lat Pulldown (Close Grip)",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [
      "biceps",
      "upper back",
      "front delts"
    ],
    "equipment": "cable",
    "instructions": [
      "Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.",
      "Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.",
      "As you have both arms extended in front of you - while holding the bar at the chosen grip width - bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
      "As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary (only the arms should move). The forearms should do no other work except for holding the bar; therefore do not try to pull the bar down using the forearms.",
      "After a second in the contracted position, while squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.",
      "6. Repeat this motion for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Front_Lat_Pulldown/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Front_Lat_Pulldown/1.jpg"
    ]
  },
  {
    "id": "seated-cable-row",
    "name": "Seated Cable Row",
    "primaryMuscles": [
      "upper back"
    ],
    "secondaryMuscles": [
      "biceps",
      "lats",
      "front delts"
    ],
    "equipment": "cable",
    "instructions": [
      "For this exercise you will need access to a low pulley row machine with a V-bar. Note: The V-bar will enable you to have a neutral grip where the palms of your hands face each other. To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked.",
      "Lean over as you keep the natural alignment of your back and grab the V-bar handles.",
      "With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise.",
      "Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/1.jpg"
    ]
  },
  {
    "id": "t-bar-row",
    "name": "T-Bar Row",
    "primaryMuscles": [
      "upper back"
    ],
    "secondaryMuscles": [
      "biceps",
      "lats"
    ],
    "equipment": "barbell",
    "instructions": [
      "Position a bar into a landmine or in a corner to keep it from moving. Load an appropriate weight onto your end.",
      "Stand over the bar, and position a Double D row handle around the bar next to the collar. Using your hips and legs, rise to a standing position.",
      "Assume a wide stance with your hips back and your chest up. Your arms should be extended. This will be your starting position.",
      "Pull the weight to your upper abdomen by retracting the shoulder blades and flexing the elbows. Do not jerk the weight or cheat during the movement.",
      "After a brief pause, return to the starting position."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row_with_Handle/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row_with_Handle/1.jpg"
    ]
  },
  {
    "id": "straight-arm-pulldown",
    "name": "Straight-Arm Pulldown",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [],
    "equipment": "cable",
    "instructions": [
      "You will start by grabbing the wide bar from the top pulley of a pulldown machine and using a wider than shoulder-width pronated (palms down) grip. Step backwards two feet or so.",
      "Bend your torso forward at the waist by around 30-degrees with your arms fully extended in front of you and a slight bend at the elbows. If your arms are not fully extended then you need to step a bit more backwards until they are. Once your arms are fully extended and your torso is slightly bent at the waist, tighten the lats and then you are ready to begin.",
      "While keeping the arms straight, pull the bar down by contracting the lats until your hands are next to the side of the thighs. Breathe out as you perform this step.",
      "While keeping the arms straight, go back to the starting position while breathing in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Straight-Arm_Pulldown/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Straight-Arm_Pulldown/1.jpg"
    ]
  },
  {
    "id": "back-extension",
    "name": "Back Extension",
    "primaryMuscles": [
      "lower back"
    ],
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "other",
    "instructions": [
      "Lie face down on a hyperextension bench, tucking your ankles securely under the footpads.",
      "Adjust the upper pad if possible so your upper thighs lie flat across the wide pad, leaving enough room for you to bend at the waist without any restriction.",
      "With your body straight, cross your arms in front of you (my preference) or behind your head. This will be your starting position. Tip: You can also hold a weight plate for extra resistance in front of you under your crossed arms.",
      "Start bending forward slowly at the waist as far as you can while keeping your back flat. Inhale as you perform this movement. Keep moving forward until you feel a nice stretch on the hamstrings and you can no longer keep going without a rounding of the back. Tip: Never round the back as you perform this exercise. Also, some people can go farther than others. The key thing is that you go as far as your body allows you to without rounding the back.",
      "Slowly raise your torso back to the initial position as you inhale. Tip: Avoid the temptation to arch your back past a straight line. Also, do not swing the torso at any time in order to protect the back from injury.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hyperextensions_Back_Extensions/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hyperextensions_Back_Extensions/1.jpg"
    ]
  },
  {
    "id": "good-morning",
    "name": "Good Morning",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "abs",
      "glutes",
      "lower back"
    ],
    "equipment": "barbell",
    "instructions": [
      "Begin with a bar on a rack at shoulder height. Rack the bar across the rear of your shoulders as you would a power squat, not on top of your shoulders. Keep your back tight, shoulder blades pinched together, and your knees slightly bent. Step back from the rack.",
      "Begin by bending at the hips, moving them back as you bend over to near parallel. Keep your back arched and your cervical spine in proper alignment.",
      "Reverse the motion by extending through the hips with your glutes and hamstrings. Continue until you have returned to the starting position."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Good_Morning/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Good_Morning/1.jpg"
    ]
  },
  {
    "id": "shrug-barbell",
    "name": "Shrug (Barbell)",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [],
    "equipment": "barbell",
    "instructions": [
      "Stand up straight with your feet at shoulder width as you hold a barbell with both hands in front of you using a pronated grip (palms facing the thighs). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for a better grip. This will be your starting position.",
      "Raise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps.",
      "Slowly return to the starting position as you breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shrug/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shrug/1.jpg"
    ]
  },
  {
    "id": "shrug-dumbbell",
    "name": "Shrug (Dumbbell)",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [],
    "equipment": "dumbbell",
    "instructions": [
      "Stand erect with a dumbbell on each hand (palms facing your torso), arms extended on the sides.",
      "Lift the dumbbells by elevating the shoulders as high as possible while you exhale. Hold the contraction at the top for a second. Tip: The arms should remain extended at all times. Refrain from using the biceps to help lift the dumbbells. Only the shoulders should be moving up and down.",
      "Lower the dumbbells back to the original position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/1.jpg"
    ]
  },
  {
    "id": "barbell-curl",
    "name": "Barbell Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "equipment": "barbell",
    "instructions": [
      "Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.",
      "While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.",
      "Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.",
      "Slowly begin to bring the bar back to starting position as your breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/1.jpg"
    ]
  },
  {
    "id": "dumbbell-curl",
    "name": "Dumbbell Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Stand up straight with a dumbbell in each hand at arm's length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position.",
      "Now, keeping the upper arms stationary, exhale and curl the weights while contracting your biceps. Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a brief pause as you squeeze your biceps.",
      "Then, inhale and slowly begin to lower the dumbbells back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bicep_Curl/1.jpg"
    ]
  },
  {
    "id": "hammer-curl",
    "name": "Hammer Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "equipment": "dumbbell",
    "instructions": [
      "Stand up with your torso upright and a dumbbell on each hand being held at arms length. The elbows should be close to the torso.",
      "The palms of the hands should be facing your torso. This will be your starting position.",
      "Now, while holding your upper arm stationary, exhale and curl the weight forward while contracting the biceps. Continue to raise the weight until the biceps are fully contracted and the dumbbell is at shoulder level. Hold the contracted position for a brief moment as you squeeze the biceps. Tip: Focus on keeping the elbow stationary and only moving your forearm.",
      "After the brief pause, inhale and slowly begin the lower the dumbbells back down to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/1.jpg"
    ]
  },
  {
    "id": "preacher-curl",
    "name": "Preacher Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "equipment": "barbell",
    "instructions": [
      "To perform this movement you will need a preacher bench and an E-Z bar. Grab the E-Z curl bar at the close inner handle (either have someone hand you the bar which is preferable or grab the bar from the front bar rest provided by most preacher benches). The palm of your hands should be facing forward and they should be slightly tilted inwards due to the shape of the bar.",
      "With the upper arms positioned against the preacher bench pad and the chest against it, hold the E-Z Curl Bar at shoulder length. This will be your starting position.",
      "As you breathe in, slowly lower the bar until your upper arm is extended and the biceps is fully stretched.",
      "As you exhale, use the biceps to curl the weight up until your biceps is fully contracted and the bar is at shoulder height. Squeeze the biceps hard and hold this position for a second.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/1.jpg"
    ]
  },
  {
    "id": "incline-dumbbell-curl",
    "name": "Incline Dumbbell Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "equipment": "dumbbell",
    "instructions": [
      "Sit back on an incline bench with a dumbbell in each hand held at arms length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position.",
      "While holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second.",
      "Slowly begin to bring the dumbbells back to starting position as your breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Curl/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Curl/1.jpg"
    ]
  },
  {
    "id": "concentration-curl",
    "name": "Concentration Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Sit down on a flat bench with one dumbbell in front of you between your legs. Your legs should be spread with your knees bent and feet on the floor.",
      "Use your right arm to pick the dumbbell up. Place the back of your right upper arm on the top of your inner right thigh. Rotate the palm of your hand until it is facing forward away from your thigh. Tip: Your arm should be extended and the dumbbell should be above the floor. This will be your starting position.",
      "While holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Tip: At the top of the movement make sure that the little finger of your arm is higher than your thumb. This guarantees a good contraction. Hold the contracted position for a second as you squeeze the biceps.",
      "Slowly begin to bring the dumbbells back to starting position as your breathe in. Caution: Avoid swinging motions at any time.",
      "Repeat for the recommended amount of repetitions. Then repeat the movement with the left arm."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Concentration_Curls/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Concentration_Curls/1.jpg"
    ]
  },
  {
    "id": "cable-rope-hammer-curl",
    "name": "Cable Rope Hammer Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [],
    "equipment": "cable",
    "instructions": [
      "Attach a rope attachment to a low pulley and stand facing the machine about 12 inches away from it.",
      "Grasp the rope with a neutral (palms-in) grip and stand straight up keeping the natural arch of the back and your torso stationary.",
      "Put your elbows in by your side and keep them there stationary during the entire movement. Tip: Only the forearms should move; not your upper arms. This will be your starting position.",
      "Using your biceps, pull your arms up as you exhale until your biceps touch your forearms. Tip: Remember to keep the elbows in and your upper arms stationary.",
      "After a 1 second contraction where you squeeze your biceps, slowly start to bring the weight back to the original position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Hammer_Curls_-_Rope_Attachment/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Hammer_Curls_-_Rope_Attachment/1.jpg"
    ]
  },
  {
    "id": "ez-bar-curl",
    "name": "EZ-Bar Curl",
    "primaryMuscles": [
      "biceps"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "equipment": "barbell",
    "instructions": [
      "Stand up with your torso upright while holding an E-Z Curl Bar at the closer inner handle. The palm of your hands should be facing forward and they should be slightly tilted inwards due to the shape of the bar. The elbows should be close to the torso. This will be your starting position.",
      "While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.",
      "Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.",
      "Slowly begin to bring the bar back to starting position as your breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_EZ_Bar_Curl/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_EZ_Bar_Curl/1.jpg"
    ]
  },
  {
    "id": "close-grip-bench-press",
    "name": "Close-Grip Bench Press",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "chest",
      "front delts"
    ],
    "equipment": "barbell",
    "instructions": [
      "Lie back on a flat bench. Using a close grip (around shoulder width), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
      "As you breathe in, come down slowly until you feel the bar on your middle chest. Tip: Make sure that - as opposed to a regular bench press - you keep the elbows close to the torso at all times in order to maximize triceps involvement.",
      "After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your triceps muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up.",
      "Repeat the movement for the prescribed amount of repetitions.",
      "When you are done, place the bar back in the rack."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Barbell_Bench_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Barbell_Bench_Press/1.jpg"
    ]
  },
  {
    "id": "triceps-pushdown",
    "name": "Triceps Pushdown",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "equipment": "cable",
    "instructions": [
      "Attach a straight or angled bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width.",
      "Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the bar. This is your starting position.",
      "Using the triceps, bring the bar down until it touches the front of your thighs and the arms are fully extended perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.",
      "After a second hold at the contracted position, bring the bar slowly up to the starting point. Breathe in as you perform this step.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/1.jpg"
    ]
  },
  {
    "id": "triceps-rope-pushdown",
    "name": "Triceps Rope Pushdown",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "equipment": "cable",
    "instructions": [
      "Attach a rope attachment to a high pulley and grab with a neutral grip (palms facing each other).",
      "Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the rope with the palms facing each other. This is your starting position.",
      "Using the triceps, bring the rope down as you bring each side of the rope to the side of your thighs. At the end of the movement the arms are fully extended and perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.",
      "After holding for a second, at the contracted position, bring the rope slowly up to the starting point. Breathe in as you perform this step.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown_-_Rope_Attachment/1.jpg"
    ]
  },
  {
    "id": "skullcrusher",
    "name": "Skullcrusher",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "equipment": "ez bar",
    "instructions": [
      "Lie on a flat bench with either an e-z bar (my preference) or a straight bar placed on the floor behind your head and your feet on the floor.",
      "Grab the bar behind you, using a medium overhand (pronated) grip, and raise the bar in front of you at arms length. Tip: The arms should be perpendicular to the torso and the floor. The elbows should be tucked in. This is the starting position.",
      "As you breathe in, slowly lower the weight until the bar lightly touches your forehead while keeping the upper arms and elbows stationary.",
      "At that point, use the triceps to bring the weight back up to the starting position as you breathe out.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/1.jpg"
    ]
  },
  {
    "id": "overhead-triceps-extension-dumbbell",
    "name": "Overhead Triceps Extension (Dumbbell)",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "equipment": "dumbbell",
    "instructions": [
      "To begin, stand up with a dumbbell held by both hands. Your feet should be about shoulder width apart from each other. Slowly use both hands to grab the dumbbell and lift it over your head until both arms are fully extended.",
      "The resistance should be resting in the palms of your hands with your thumbs around it. The palm of the hands should be facing up towards the ceiling. This will be your starting position.",
      "Keeping your upper arms close to your head with elbows in and perpendicular to the floor, lower the resistance in a semicircular motion behind your head until your forearms touch your biceps. Tip: The upper arms should remain stationary and only the forearms should move. Breathe in as you perform this step.",
      "Go back to the starting position by using the triceps to raise the dumbbell. Breathe out as you perform this step.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Dumbbell_Triceps_Extension/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Dumbbell_Triceps_Extension/1.jpg"
    ]
  },
  {
    "id": "overhead-triceps-extension-cable",
    "name": "Overhead Triceps Extension (Cable)",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [],
    "equipment": "cable",
    "instructions": [
      "Attach a rope to the bottom pulley of the pulley machine.",
      "Grasping the rope with both hands, extend your arms with your hands directly above your head using a neutral grip (palms facing each other). Your elbows should be in close to your head and the arms should be perpendicular to the floor with the knuckles aimed at the ceiling. This will be your starting position.",
      "Slowly lower the rope behind your head as you hold the upper arms stationary. Inhale as you perform this movement and pause when your triceps are fully stretched.",
      "Return to the starting position by flexing your triceps as you breathe out.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rope_Overhead_Triceps_Extension/1.jpg"
    ]
  },
  {
    "id": "triceps-dip",
    "name": "Triceps Dip",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "chest",
      "front delts"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "To get into the starting position, hold your body at arm's length with your arms nearly locked above the bars.",
      "Now, inhale and slowly lower yourself downward. Your torso should remain upright and your elbows should stay close to your body. This helps to better focus on tricep involvement. Lower yourself until there is a 90 degree angle formed between the upper arm and forearm.",
      "Then, exhale and push your torso back up using your triceps to bring your body back to the starting position.",
      "Repeat the movement for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Triceps_Version/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Triceps_Version/1.jpg"
    ]
  },
  {
    "id": "bench-dip",
    "name": "Bench Dip",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "chest",
      "front delts"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "For this exercise you will need to place a bench behind your back. With the bench perpendicular to your body, and while looking away from it, hold on to the bench on its edge with the hands fully extended, separated at shoulder width. The legs will be extended forward, bent at the waist and perpendicular to your torso. This will be your starting position.",
      "Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down.",
      "Using your triceps to bring your torso up again, lift yourself back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/1.jpg"
    ]
  },
  {
    "id": "squat-barbell",
    "name": "Squat (Barbell)",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings",
      "lower back"
    ],
    "equipment": "barbell",
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack to just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).",
      "Begin to slowly lower the bar by bending the knees and hips as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
      "Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/1.jpg"
    ]
  },
  {
    "id": "front-squat",
    "name": "Front Squat",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "equipment": "barbell",
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, bring your arms up under the bar while keeping the elbows high and the upper arm slightly above parallel to the floor. Rest the bar on top of the deltoids and cross your arms while grasping the bar for total control.",
      "Lift the bar off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).",
      "Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
      "Begin to raise the bar as you exhale by pushing the floor mainly with the middle of your foot as you straighten the legs again and go back to the starting position.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Barbell_Squat/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Barbell_Squat/1.jpg"
    ]
  },
  {
    "id": "goblet-squat",
    "name": "Goblet Squat",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings",
      "front delts"
    ],
    "equipment": "kettlebell",
    "instructions": [
      "Stand holding a light kettlebell by the horns close to your chest. This will be your starting position.",
      "Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight.",
      "At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/1.jpg"
    ]
  },
  {
    "id": "bodyweight-squat",
    "name": "Bodyweight Squat",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.",
      "Begin the movement by flexing your knees and hips, sitting back with your hips.",
      "Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Squat/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Squat/1.jpg"
    ]
  },
  {
    "id": "hack-squat-barbell",
    "name": "Hack Squat (Barbell)",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "forearms",
      "hamstrings"
    ],
    "equipment": "barbell",
    "instructions": [
      "Stand up straight while holding a barbell behind you at arms length and your feet at shoulder width. Tip: A shoulder width grip is best with the palms of your hands facing back. You can use wrist wraps for this exercise for a better grip. This will be your starting position.",
      "While keeping your head and eyes up and back straight, squat until your upper thighs are parallel to the floor. Breathe in as you slowly go down.",
      "Pressing mainly with the heel of the foot and squeezing the thighs, go back up as you breathe out.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hack_Squat/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hack_Squat/1.jpg"
    ]
  },
  {
    "id": "leg-press",
    "name": "Leg Press",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "equipment": "machine",
    "instructions": [
      "Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).",
      "Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.",
      "As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.",
      "Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.",
      "Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/1.jpg"
    ]
  },
  {
    "id": "leg-extension",
    "name": "Leg Extension",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [],
    "equipment": "machine",
    "instructions": [
      "For this exercise you will need to use a leg extension machine. First choose your weight and sit on the machine with your legs under the pad (feet pointed forward) and the hands holding the side bars. This will be your starting position. Tip: You will need to adjust the pad so that it falls on top of your lower leg (just above your feet). Also, make sure that your legs form a 90-degree angle between the lower and upper leg. If the angle is less than 90-degrees then that means the knee is over the toes which in turn creates undue stress at the knee joint. If the machine is designed that way, either look for another machine or just make sure that when you start executing the exercise you stop going down once you hit the 90-degree angle.",
      "Using your quadriceps, extend your legs to the maximum as you exhale. Ensure that the rest of the body remains stationary on the seat. Pause a second on the contracted position.",
      "Slowly lower the weight back to the original position as you inhale, ensuring that you do not go past the 90-degree angle limit.",
      "Repeat for the recommended amount of times."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/1.jpg"
    ]
  },
  {
    "id": "lying-leg-curl",
    "name": "Lying Leg Curl",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [],
    "equipment": "machine",
    "instructions": [
      "Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves). Tip: Preferably use a leg curl machine that is angled as opposed to flat since an angled position is more favorable for hamstrings recruitment.",
      "Keeping the torso flat on the bench, ensure your legs are fully stretched and grab the side handles of the machine. Position your toes straight (or you can also use any of the other two stances described on the foot positioning section). This will be your starting position.",
      "As you exhale, curl your legs up as far as possible without lifting the upper legs from the pad. Once you hit the fully contracted position, hold it for a second.",
      "As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/1.jpg"
    ]
  },
  {
    "id": "seated-leg-curl",
    "name": "Seated Leg Curl",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [],
    "equipment": "machine",
    "instructions": [
      "Adjust the machine lever to fit your height and sit on the machine with your back against the back support pad.",
      "Place the back of lower leg on top of padded lever (just a few inches under the calves) and secure the lap pad against your thighs, just above the knees. Then grasp the side handles on the machine as you point your toes straight (or you can also use any of the other two stances) and ensure that the legs are fully straight right in front of you. This will be your starting position.",
      "As you exhale, pull the machine lever as far as possible to the back of your thighs by flexing at the knees. Keep your torso stationary at all times. Hold the contracted position for a second.",
      "Slowly return to the starting position as you breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Leg_Curl/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Leg_Curl/1.jpg"
    ]
  },
  {
    "id": "lunge-dumbbell",
    "name": "Lunge (Dumbbell)",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.",
      "Step forward with your right leg around 2 feet or so from the foot being left stationary behind and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground.",
      "Using mainly the heel of your foot, push up and go back to the starting position as you exhale.",
      "Repeat the movement for the recommended amount of repetitions and then perform with the left leg."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/1.jpg"
    ]
  },
  {
    "id": "lunge-barbell",
    "name": "Lunge (Barbell)",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "equipment": "barbell",
    "instructions": [
      "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
      "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
      "Step away from the rack and step forward with your right leg and squat down through your hips, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: Do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. li>",
      "Using mainly the heel of your foot, push up and go back to the starting position as you exhale.",
      "Repeat the movement for the recommended amount of repetitions and then perform with the left leg."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Lunge/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Lunge/1.jpg"
    ]
  },
  {
    "id": "walking-lunge",
    "name": "Walking Lunge",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "equipment": "barbell",
    "instructions": [
      "Begin standing with your feet shoulder width apart and a barbell across your upper back.",
      "Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot.",
      "Drive through the heel of your lead foot and extend both knees to raise yourself back up.",
      "Step forward with your rear foot, repeating the lunge on the opposite leg."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Walking_Lunge/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Walking_Lunge/1.jpg"
    ]
  },
  {
    "id": "bulgarian-split-squat-dumbbell",
    "name": "Bulgarian Split Squat (Dumbbell)",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Position yourself into a staggered stance with the rear foot elevated and front foot forward.",
      "Hold a dumbbell in each hand, letting them hang at the sides. This will be your starting position.",
      "Begin by descending, flexing your knee and hip to lower your body down. Maintain good posture througout the movement. Keep the front knee in line with the foot as you perform the exercise.",
      "At the bottom of the movement, drive through the heel to extend the knee and hip to return to the starting position."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/1.jpg"
    ]
  },
  {
    "id": "bulgarian-split-squat-barbell",
    "name": "Bulgarian Split Squat (Barbell)",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "hamstrings"
    ],
    "equipment": "barbell",
    "instructions": [
      "Start by standing about 2 to 3 feet in front of a flat bench with your back facing the bench. Have a barbell in front of you on the floor. Tip: Your feet should be shoulder width apart from each other.",
      "Bend the knees and use a pronated grip with your hands being wider than shoulder width apart from each other to lift the barbell up until you can rest it on your chest.",
      "Then lift the barbell over your head and rest it on the base of your neck. Move one foot back so that your toe is resting on the flat bench. Your other foot should be stationary in front of you. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. Tip: Make sure your back is straight and chest is out while performing this exercise.",
      "As you inhale, slowly lower your leg until your thigh is parallel to the floor. At this point, your knee should be over your toes. Your chest should be directly above the middle of your thigh.",
      "Leading with the chest and hips and contracting the quadriceps, elevate your leg back to the starting position as you exhale.",
      "Repeat for the recommended amount of repetitions.",
      "Switch legs and repeat the movement."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One_Leg_Barbell_Squat/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One_Leg_Barbell_Squat/1.jpg"
    ]
  },
  {
    "id": "hip-thrust",
    "name": "Hip Thrust",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "calves",
      "hamstrings"
    ],
    "equipment": "barbell",
    "instructions": [
      "Begin seated on the ground with a bench directly behind you. Have a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise.",
      "Roll the bar so that it is directly above your hips, and lean back against the bench so that your shoulder blades are near the top of it.",
      "Begin the movement by driving through your feet, extending your hips vertically through the bar. Your weight should be supported by your shoulder blades and your feet. Extend as far as possible, then reverse the motion to return to the starting position."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/1.jpg"
    ]
  },
  {
    "id": "glute-kickback",
    "name": "Glute Kickback",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "Kneel on the floor or an exercise mat and bend at the waist with your arms extended in front of you (perpendicular to the torso) in order to get into a kneeling push-up position but with the arms spaced at shoulder width. Your head should be looking forward and the bend of the knees should create a 90-degree angle between the hamstrings and the calves. This will be your starting position.",
      "As you exhale, lift up your right leg until the hamstrings are in line with the back while maintaining the 90-degree angle bend. Contract the glutes throughout this movement and hold the contraction at the top for a second. Tip: At the end of the movement the upper leg should be parallel to the floor while the calf should be perpendicular to it.",
      "Go back to the initial position as you inhale and now repeat with the left leg.",
      "Continue to alternate legs until all of the recommended repetitions have been performed."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Glute_Kickback/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Glute_Kickback/1.jpg"
    ]
  },
  {
    "id": "standing-calf-raise",
    "name": "Standing Calf Raise",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [],
    "equipment": "machine",
    "instructions": [
      "Adjust the padded lever of the calf raise machine to fit your height.",
      "Place your shoulders under the pads provided and position your toes facing forward (or using any of the two other positions described at the beginning of the chapter). The balls of your feet should be secured on top of the calf block with the heels extending off it. Push the lever up by extending your hips and knees until your torso is standing erect. The knees should be kept with a slight bend; never locked. Toes should be facing forward, outwards or inwards as described at the beginning of the chapter. This will be your starting position.",
      "Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.",
      "Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/1.jpg"
    ]
  },
  {
    "id": "seated-calf-raise",
    "name": "Seated Calf Raise",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [],
    "equipment": "machine",
    "instructions": [
      "Sit on the machine and place your toes on the lower portion of the platform provided with the heels extending off. Choose the toe positioning of your choice (forward, in, or out) as per the beginning of this chapter.",
      "Place your lower thighs under the lever pad, which will need to be adjusted according to the height of your thighs. Now place your hands on top of the lever pad in order to prevent it from slipping forward.",
      "Lift the lever slightly by pushing your heels up and release the safety bar. This will be your starting position.",
      "Slowly lower your heels by bending at the ankles until the calves are fully stretched. Inhale as you perform this movement.",
      "Raise the heels by extending the ankles as high as possible as you contract the calves and breathe out. Hold the top contraction for a second.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Calf_Raise/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Calf_Raise/1.jpg"
    ]
  },
  {
    "id": "calf-press-leg-press-machine",
    "name": "Calf Press (Leg Press Machine)",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [],
    "equipment": "machine",
    "instructions": [
      "Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance.",
      "Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you without locking your knees. (Note: In some leg press units you can leave the safety bars on for increased safety. If your leg press unit allows for this, then this is the preferred method of performing the exercise.) Your torso and the legs should make perfect 90-degree angle. Now carefully place your toes and balls of your feet on the lower portion of the platform with the heels extending off. Toes should be facing forward, outwards or inwards as described at the beginning of the chapter. This will be your starting position.",
      "Press on the platform by raising your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.",
      "Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Press_On_The_Leg_Press_Machine/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Press_On_The_Leg_Press_Machine/1.jpg"
    ]
  },
  {
    "id": "crunch",
    "name": "Crunch",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [],
    "equipment": "bodyweight",
    "instructions": [
      "Lie flat on your back with your feet flat on the ground, or resting on a bench with your knees bent at a 90 degree angle. If you are resting your feet on a bench, place them three to four inches apart and point your toes inward so they touch.",
      "Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don't lock your fingers behind your head.",
      "While pushing the small of your back down in the floor to better isolate your abdominal muscles, begin to roll your shoulders off the floor.",
      "Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the floor only about four inches, and your lower back should remain on the floor. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don't cheat yourself by using momentum.",
      "After the one second contraction, begin to come down slowly again to the starting position as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/1.jpg"
    ]
  },
  {
    "id": "decline-crunch",
    "name": "Decline Crunch",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [],
    "equipment": "bodyweight",
    "instructions": [
      "Secure your legs at the end of the decline bench and lie down.",
      "Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don't lock your fingers behind your head.",
      "While pushing the small of your back down in the bench to better isolate your abdominal muscles, begin to roll your shoulders off it.",
      "Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the bench only about four inches, and your lower back should remain on the bench. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don't cheat yourself by using momentum.",
      "After the one second contraction, begin to come down slowly again to the starting position as you inhale.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Crunch/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Crunch/1.jpg"
    ]
  },
  {
    "id": "cable-crunch",
    "name": "Cable Crunch",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [],
    "equipment": "cable",
    "instructions": [
      "Kneel below a high pulley that contains a rope attachment.",
      "Grasp cable rope attachment and lower the rope until your hands are placed next to your face.",
      "Flex your hips slightly and allow the weight to hyperextend the lower back. This will be your starting position.",
      "With the hips stationary, flex the waist as you contract the abs so that the elbows travel towards the middle of the thighs. Exhale as you perform this portion of the movement and hold the contraction for a second.",
      "Slowly return to the starting position as you inhale. Tip: Make sure that you keep constant tension on the abs throughout the movement. Also, do not choose a weight so heavy that the lower back handles the brunt of the work.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crunch/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crunch/1.jpg"
    ]
  },
  {
    "id": "ab-machine-crunch",
    "name": "Ab Machine Crunch",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [],
    "equipment": "machine",
    "instructions": [
      "Select a light resistance and sit down on the ab machine placing your feet under the pads provided and grabbing the top handles. Your arms should be bent at a 90 degree angle as you rest the triceps on the pads provided. This will be your starting position.",
      "At the same time, begin to lift the legs up as you crunch your upper torso. Breathe out as you perform this movement. Tip: Be sure to use a slow and controlled motion. Concentrate on using your abs to move the weight while relaxing your legs and feet.",
      "After a second pause, slowly return to the starting position as you breathe in.",
      "Repeat the movement for the prescribed amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ab_Crunch_Machine/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ab_Crunch_Machine/1.jpg"
    ]
  },
  {
    "id": "plank",
    "name": "Plank",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [],
    "equipment": "bodyweight",
    "instructions": [
      "Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.",
      "Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/1.jpg"
    ]
  },
  {
    "id": "side-plank",
    "name": "Side Plank",
    "primaryMuscles": [
      "obliques"
    ],
    "secondaryMuscles": [
      "front delts"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "Lie on your side with legs stacked and prop yourself up on your forearm, elbow under shoulder.",
      "Lift your hips until your body forms a straight line from head to feet. Brace your core.",
      "Hold for the target time without letting the hips sag, then switch sides."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Bridge/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Bridge/1.jpg"
    ]
  },
  {
    "id": "hanging-leg-raise",
    "name": "Hanging Leg Raise",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [],
    "equipment": "bodyweight",
    "instructions": [
      "Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position.",
      "Raise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so.",
      "Go back slowly to the starting position as you breathe in.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/1.jpg"
    ]
  },
  {
    "id": "russian-twist",
    "name": "Russian Twist",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "lower back"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.",
      "Elevate your upper body so that it creates an imaginary V-shape with your thighs. Your arms should be fully extended in front of you perpendicular to your torso and with the hands clasped. This is the starting position.",
      "Twist your torso to the right side until your arms are parallel with the floor while breathing out.",
      "Hold the contraction for a second and move back to the starting position while breathing out. Now move to the opposite side performing the same techniques you applied to the right side.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_Twist/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_Twist/1.jpg"
    ]
  },
  {
    "id": "kettlebell-swing",
    "name": "Kettlebell Swing",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes",
      "lower back",
      "front delts"
    ],
    "equipment": "kettlebell",
    "instructions": [
      "Stand with feet shoulder-width apart, kettlebell on the floor slightly in front of you.",
      "Hinge at the hips, grab the handle, and hike the bell back between your legs.",
      "Drive your hips forward explosively to swing the bell to chest height, arms relaxed.",
      "Let the bell swing back between your legs and repeat, keeping your back flat throughout."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Kettlebell_Swings/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Kettlebell_Swings/1.jpg"
    ]
  },
  {
    "id": "farmer-s-walk",
    "name": "Farmer’s Walk",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "abs",
      "glutes",
      "hamstrings",
      "lower back",
      "quads",
      "traps"
    ],
    "equipment": "other",
    "instructions": [
      "There are various implements that can be used for the farmers walk. These can also be performed with heavy dumbbells or short bars if these implements aren't available. Begin by standing between the implements.",
      "After gripping the handles, lift them up by driving through your heels, keeping your back straight and your head up.",
      "Walk taking short, quick steps, and don't forget to breathe. Move for a given distance, typically 50-100 feet, as fast as possible."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/1.jpg"
    ]
  },
  {
    "id": "wrist-curl",
    "name": "Wrist Curl",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [],
    "equipment": "barbell",
    "instructions": [
      "Start out by placing a barbell on one side of a flat bench.",
      "Kneel down on both of your knees so that your body is facing the flat bench.",
      "Use your arms to grab the barbell with a supinated grip (palms up) and bring them up so that your forearms are resting against the flat bench. Your wrists should be hanging over the edge.",
      "Start out by curling your wrist upwards and exhaling.",
      "Slowly lower your wrists back down to the starting position while inhaling.",
      "Your forearms should be stationary as your wrist is the only movement needed to perform this exercise.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/1.jpg"
    ]
  },
  {
    "id": "reverse-wrist-curl",
    "name": "Reverse Wrist Curl",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [],
    "equipment": "barbell",
    "instructions": [
      "Start out by placing a barbell on one side of a flat bench.",
      "Kneel down on both of your knees so that your body is facing the flat bench.",
      "Use your arms to grab the barbell with a pronated grip (palms down) and bring them up so that your forearms are resting against the flat bench. Your wrists should be hanging over the edge.",
      "Start out by curling your wrist upwards and exhaling.",
      "Slowly lower your wrists back down to the starting position while inhaling.",
      "Your forearms should be stationary as your wrist is the only movement needed to perform this exercise.",
      "Repeat for the recommended amount of repetitions."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Palms-Down_Wrist_Curl_Over_A_Bench/1.jpg"
    ]
  },
  {
    "id": "bulgarian-split-squat-bodyweight",
    "name": "Bulgarian Split Squat (Bodyweight)",
    "primaryMuscles": [
      "quads"
    ],
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "bodyweight",
    "instructions": [
      "Stand about 2 to 3 feet in front of a bench with your back to it, and place the top of one foot on the bench behind you.",
      "Keep your torso upright and your front knee in line with your foot. This will be your starting position.",
      "Descend by flexing the front knee and hip, lowering until the front thigh is about parallel to the floor. The rear knee should travel toward the ground.",
      "Drive through the heel of the front foot to return to the starting position. Complete all reps, then switch legs."
    ],
    "images": [
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squats/0.jpg",
      "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squats/1.jpg"
    ]
  },
  {
    "id": "single-arm-lat-pulldown-cable",
    "name": "Lat Pulldown (Single Arm)",
    "primaryMuscles": [
      "lats"
    ],
    "secondaryMuscles": [
      "biceps",
      "upper back",
      "front delts"
    ],
    "equipment": "cable",
    "instructions": [
      "Attach a single handle to the high pulley of a lat pulldown or cable station and sit or kneel facing it.",
      "Grip the handle with one hand, arm fully extended overhead, and brace your core.",
      "Pull the handle down toward the side of your chest, driving your elbow down and back and squeezing the lat.",
      "Control the handle back to the fully stretched overhead position. Complete all reps, then switch arms."
    ],
    "images": []
  },
  {
    "id": "iso-lateral-chest-press-machine",
    "name": "Iso-Lateral Chest Press (Machine)",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "front delts",
      "triceps"
    ],
    "equipment": "machine",
    "instructions": [
      "Sit in the iso-lateral chest press machine with your back flat against the pad and grip the handles at chest level.",
      "Press the handles forward until your arms are nearly straight, keeping your shoulders down.",
      "Squeeze your chest at the top, then control the handles back to the starting position without letting the weight rest."
    ],
    "images": []
  },
  {
    "id": "reverse-curl-dumbbell",
    "name": "Reverse Curl (Dumbbell)",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "biceps"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Stand holding a dumbbell in each hand with a pronated (palms-down) grip, arms hanging at your sides.",
      "Keeping your upper arms pinned to your sides, curl the dumbbells up by flexing at the elbow.",
      "Squeeze the forearms and brachialis at the top, then lower under control to the start."
    ],
    "images": []
  },
  {
    "id": "chest-supported-row-dumbbell",
    "name": "Chest-Supported Row (Dumbbell)",
    "primaryMuscles": [
      "upper back"
    ],
    "secondaryMuscles": [
      "lats",
      "rear delts",
      "biceps"
    ],
    "equipment": "dumbbell",
    "instructions": [
      "Set an incline bench to about 30–45 degrees and lie face-down with your chest against the pad, a dumbbell in each hand hanging straight down.",
      "Let your arms extend fully and your shoulder blades relax at the bottom. This is the starting position.",
      "Row the dumbbells up toward your hips, driving your elbows back and squeezing your shoulder blades together at the top.",
      "Lower the dumbbells under control to the fully stretched position without letting your chest come off the pad, and repeat."
    ],
    "images": []
  }
]

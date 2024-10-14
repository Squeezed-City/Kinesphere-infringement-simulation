# Kinesphere infringement simulation
This is a kinesphere infringement simulation based on processing.js
Each script is a html file with an included js file and p5.js library. They can simply be opened with any browser or the processing.org editor. 

kinesphere_sim simulates the process of kinesphere infringement (people running into each other personal space) at different densities. With a slider, the population can be adjusted, and changes in the rate of KI/s (kinesphere infringement per second) observed. Additionally, obstacles can be drawn on the canvas and the change in kinesphere infringement observed. Each event of KI creates a trace, a little white dot, that over time highlight the places where people tend to run into each other the most. 

kinesphere_sim_benchmark is an automated script that runs at different densities, and saves the resulting KI for each density as a text file. The goal of this experiment was to find out whether there is a linear relationship between density of a place and the amount of kinesphere infringement. It turns out, the relationship is not linear. 
Instead, KI/s grows slowly but linearly until it reaches the density of 0.33 person per square meter. At this point it grows much faster until about 0.4 person/sqm. From there again, it grows linearly, but at a faster rate than before. The results of multiple runs can be seen here:
https://docs.google.com/spreadsheets/d/1-9XqrJFYEuxR32oCWIdpAyScP53kkHzmtHD4uRlFC9g/

My explanation is that at a density of 0.33-0.4 person/sqm a phase transition happens, from personal space to crowd space. Where in at lower densities strategies of avoiding other people might work out well, the reaching crowd space (over 0.4 person/sqm), the surroundings are so crowded that kinesphere infringement becomes unavoidable. 

These are of course only numerical results from the simulation and thus based on the rules programmed into it, and might not be replicated in the wild. 

Here's a breakdown of the avoidance alogrithm:

1. Finding Nearby Dots: We start by calculating the distance to all other dots in the simulation.

2. Selecting Closest Dots: The distances array is sorted based on distance, from nearest to farthest. The three closest dots are selected using distances.slice(0, 3).

3. Calculating Mean Distance: The mean distance of the three closest dots is calculated.

4. Determining Avoidance Field: An avoidance field is calculated using the formula:
field = sqrtMeanDistance + 1000/(sqrt(numDots*20))
This formula adjusts the field based on the total number of dots and the mean distance to the closest dots.
The square root of the mean distance (sqrtMeanDistance) is used to make the field grow more slowly as distance increases.

5. Applying Avoidance Forces:
For each of the three closest dots:
If the distance is less than the calculated field:
A repulsion vector is created pointing from the other dot to this dot.
The repulsion vector is normalized (set to unit length).
The strength of repulsion is inversely proportional to the distance (1 / (0.5 * distance)).
This repulsion force is then applied to the dot's acceleration.

Key aspects of this avoidance logic:
It only considers the three closest dots, which is more efficient than checking all dots.
The avoidance field size adapts based on the total number of dots and local dot density.
The repulsion force increases as dots get closer to each other.
Using the square root of the mean distance helps create a more gradual transition in avoidance behavior.
This approach aims to create a balance between efficient computation and realistic flocking-like behavior, where dots maintain some distance from each other without clustering too tightly or spreading too far apart.

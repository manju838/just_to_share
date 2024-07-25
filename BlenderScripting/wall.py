# Not working from vscode but it works from blender scripting

"""
Take in a csv file using bounding box from YOLO model and create a blender model from it. Make sure csv file is there in C directory

Returns:
    _type_: _description_
"""

import bpy
from math import sqrt
import csv
import os

def read_csv(csv_filename):
    """
    # Current Working Directory is the bash terminal path
    cwd = os.getcwd() 
    print("Current working directory:", cwd)
    """
    # Generate the path of CSV file
    source_code_directory = os.path.dirname(os.path.abspath(__file__))
    print("Code based directory:", source_code_directory)
    csv_filepath = os.path.join(source_code_directory, csv_filename)
    
    with open(csv_filepath, mode='r') as file:
        csv_reader = csv.DictReader(file)
        header = next(csv_reader)  # If your CSV has a header row
        for row in csv_reader:
            xmin = row["xmin"]
            ymin = row["ymin"]
            xmax = row["xmax"]
            ymax = row["ymax"]
            yield(float(xmin), float(ymin), float(xmax), float(ymax))  # Each row is a list of values

class WallBuilder:
    def __init__(self, wall_height=2.5, wall_thickness=0.1, unit="meters"):
        self.unit = unit
        self.wall_height = self.convert_units(wall_height)
        self.wall_thickness = self.convert_units(wall_thickness)

    def convert_units(self, value):
        if self.unit == "feet":
            return value * 0.3048  # Convert feet to meters
        return value  # Default is meters
    
    def wall_endpoints(self, xmin, ymin, xmax, ymax):
        width = abs(xmax - xmin)
        height = abs(ymax - ymin)
        
        if height >= width:  # Vertical or square bounding box
            x_top, y_top = xmin + (width / 2), ymin
            x_bottom, y_bottom = xmin + (width / 2), ymax
            return (x_top, y_top), (x_bottom, y_bottom)
        else:  # Horizontal box
            x_right, y_right = xmin, ymin + (height / 2)
            x_left, y_left = xmax, ymin + (height / 2)
            return (x_right, y_right), (x_left, y_left)
    
    def create_wall(self, start, end, height, thickness, floor_level=0):
        start_point = (start[0], start[1], floor_level)
        end_point = (end[0], end[1], floor_level)
        
        # Calculate the direction vector from start to end point
        direction = (
            end_point[0] - start_point[0],
            end_point[1] - start_point[1],
            end_point[2] - start_point[2]
        )
        
        # Normalize the direction vector
        length = sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2)
        direction_normalized = (
            direction[0] / length,
            direction[1] / length,
            direction[2] / length
        )
        
        # Calculate the perpendicular vector for the thickness
        perpendicular = (-direction_normalized[1], direction_normalized[0], 0)
        
        # Calculate the four vertices of the wall
        vertices = [
            (start_point[0] - perpendicular[0] * thickness / 2,
             start_point[1] - perpendicular[1] * thickness / 2,
             start_point[2]),
            (start_point[0] + perpendicular[0] * thickness / 2,
             start_point[1] + perpendicular[1] * thickness / 2,
             start_point[2]),
            (end_point[0] + perpendicular[0] * thickness / 2,
             end_point[1] + perpendicular[1] * thickness / 2,
             end_point[2]),
            (end_point[0] - perpendicular[0] * thickness / 2,
             end_point[1] - perpendicular[1] * thickness / 2,
             end_point[2]),
            (start_point[0] - perpendicular[0] * thickness / 2,
             start_point[1] - perpendicular[1] * thickness / 2,
             start_point[2] + height),
            (start_point[0] + perpendicular[0] * thickness / 2,
             start_point[1] + perpendicular[1] * thickness / 2,
             start_point[2] + height),
            (end_point[0] + perpendicular[0] * thickness / 2,
             end_point[1] + perpendicular[1] * thickness / 2,
             end_point[2] + height),
            (end_point[0] - perpendicular[0] * thickness / 2,
             end_point[1] - perpendicular[1] * thickness / 2,
             end_point[2] + height),
        ]
        
        # Define the faces using the vertices computed above
        faces = [
            (0, 1, 2, 3),
            (4, 5, 6, 7),
            (0, 1, 5, 4),
            (2, 3, 7, 6),
            (1, 2, 6, 5),
            (0, 3, 7, 4),
        ]
        
        # Create a new mesh for wall
        mesh = bpy.data.meshes.new(name='WallMesh')
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        
        # Create a new object with the mesh
        obj = bpy.data.objects.new(name='Wall', object_data=mesh)
        
        # Link the object to the scene
        scene = bpy.context.scene
        scene.collection.objects.link(obj)
        
        # Make the object active and select it
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        
        # Apply transformations to reset any transformation
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

        # Set origin to geometry
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

    def create_wall_from_bbox(self, xmin, ymin, xmax, ymax):
        start, end = self.wall_endpoints(xmin, ymin, xmax, ymax)
        self.create_wall(start, end, self.wall_height, self.wall_thickness)

if __name__ == "__main__":
    # Initialize the WallBuilder with units as feet
    wall_builder = WallBuilder(wall_height=10, wall_thickness=0.3, unit="feet")
    
    # Read CSV file for bounding box coordinates
    csv_file_path = "propall1_inference_results.csv"

    for xmin, ymin, xmax, ymax in read_csv(csv_file_path):
        wall_builder.create_wall_from_bbox(xmin, ymin, xmax, ymax)
    
    # # Create a wall from bounding box
    # xmin, ymin, xmax, ymax = 0, 0, 2, 3  # Replace with actual coordinates
    # wall_builder.create_wall_from_bbox(xmin, ymin, xmax, ymax)
    
    # xmin, ymin, xmax, ymax = 0, 3, 2, 7  # Replace with actual coordinates
    # wall_builder.create_wall_from_bbox(xmin, ymin, xmax, ymax)
    
    # xmin, ymin, xmax, ymax = 2, 7, 5, 7  # Replace with actual coordinates
    # wall_builder.create_wall_from_bbox(xmin, ymin, xmax, ymax)

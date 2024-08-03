import tkinter as tk
from tkinter import filedialog
import cv2
from PIL import Image, ImageTk
import os
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
import json
import networkx as nx
import matplotlib.pyplot as plt

class WallEndpointsEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Wall Endpoints Editor")

        self.canvas = tk.Canvas(self.root, cursor="cross")
        self.canvas.pack(fill=tk.BOTH, expand=True)

        button_frame = tk.Frame(self.root)
        button_frame.pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=10)

        self.canvas_width = 1280
        self.canvas_height = 720

        self.csv_path = ""
        self.img_path = ""
        self.graph = nx.Graph()
        self.action_history = []
        self.selected_point = None
        self.snapping_enabled = True
        self.wall_endpoints_pairs = []

        self.image = None
        self.image_tk = None

        self.add_point_active = False
        self.link_points_active = False
        self.delink_points_active = False
        self.modify_point_active = False

        self.scale_factor_x = 1
        self.scale_factor_y = 1

        self.upload_csv_button = tk.Button(button_frame, text="Upload CSV", command=self.upload_csv)
        self.upload_csv_button.grid(row=0, column=0, sticky='ew', padx=5)

        self.upload_img_button = tk.Button(button_frame, text="Upload Image", command=self.upload_image)
        self.upload_img_button.grid(row=0, column=1, sticky='ew', padx=5)

        self.process_button = tk.Button(button_frame, text="Process", command=self.process)
        self.process_button.grid(row=0, column=2, sticky='ew', padx=5)

        self.add_button = tk.Button(button_frame, text="Add Point", command=self.add_point_mode)
        self.add_button.grid(row=0, column=3, sticky='ew', padx=5)

        self.link_button = tk.Button(button_frame, text="Link Points", command=self.link_points_mode)
        self.link_button.grid(row=0, column=4, sticky='ew', padx=5)

        self.delink_button = tk.Button(button_frame, text="Delink Points", command=self.delink_points_mode)
        self.delink_button.grid(row=0, column=5, sticky='ew', padx=5)

        self.canvas.bind("<Button-1>", self.handle_canvas_click)

    def upload_csv(self):
        self.csv_path = filedialog.askopenfilename(filetypes=[("CSV files", "*.csv")])
        print(f"CSV path: {self.csv_path}")

    def upload_image(self):
        self.img_path = filedialog.askopenfilename(filetypes=[("Image files", "*.jpg *.png *.jpeg")])
        print(f"Image path: {self.img_path}")
        self.display_image()

    def display_image(self):
        if self.img_path:
            img = cv2.imread(self.img_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            self.image = Image.fromarray(img)
            original_width, original_height = self.image.size
            aspect_ratio = original_width / original_height
            if aspect_ratio > 1:
                self.canvas_width = min(self.canvas_width, 1280)
                self.canvas_height = int(self.canvas_width / aspect_ratio)
            else:
                self.canvas_height = min(self.canvas_height, 720)
                self.canvas_width = int(self.canvas_height * aspect_ratio)

            self.scale_factor_x = self.canvas_width / original_width
            self.scale_factor_y = self.canvas_height / original_height

            resized_image = self.image.resize((self.canvas_width, self.canvas_height), Image.Resampling.LANCZOS)
            self.image_tk = ImageTk.PhotoImage(resized_image)
            self.canvas.create_image(0, 0, anchor=tk.NW, image=self.image_tk)
            self.draw_wall_endpoints()

    def draw_wall_endpoints(self):
        self.canvas.delete("wall_point")
        for node in self.graph.nodes:
            x, y = self.graph.nodes[node]['coord']
            x = x * self.scale_factor_x
            y = y * self.scale_factor_y
            self.canvas.create_oval(x-3, y-3, x+3, y+3, fill="red", tags="wall_point")
        for edge in self.graph.edges:
            x1, y1 = self.graph.nodes[edge[0]]['coord']
            x2, y2 = self.graph.nodes[edge[1]]['coord']
            x1 = x1 * self.scale_factor_x
            y1 = y1 * self.scale_factor_y
            x2 = x2 * self.scale_factor_x
            y2 = y2 * self.scale_factor_y
            self.canvas.create_line(x1, y1, x2, y2, fill="blue", tags="wall_point")

    def add_point_mode(self):
        self.add_point_active = True
        self.link_points_active = False
        self.modify_point_active = False

    def link_points_mode(self):
        self.link_points_active = True
        self.add_point_active = False
        self.modify_point_active = False
        self.selected_point = None

    def delink_points_mode(self):
        self.delink_points_active = True
        self.add_point_active = False
        self.modify_point_active = False
        self.selected_point = None

    def handle_canvas_click(self, event):
        x = event.x / self.scale_factor_x
        y = event.y / self.scale_factor_y
        print(f"Click at: ({x}, {y})")

        if self.add_point_active:
            new_node_id = len(self.graph.nodes)
            self.graph.add_node(new_node_id, coord=(x, y))
            self.draw_wall_endpoints()
            self.add_point_active = False
            self.action_history.append(("add_node", new_node_id))
            print("Add Point btn clicked")

        elif self.link_points_active:
            closest_node = self.find_closest_node((x, y))
            if self.selected_point is None:
                self.selected_point = closest_node
                print(f"First point selected: {self.selected_point}")
            else:
                self.graph.add_edge(self.selected_point, closest_node)
                self.draw_wall_endpoints()
                self.action_history.append(("add_edge", self.selected_point, closest_node))
                self.selected_point = None
                self.link_points_active = False
                print(f"Edge added between {self.selected_point} and {closest_node}")

        elif self.delink_points_active:
            closest_node = self.find_closest_node((x, y))
            if self.selected_point is None:
                self.selected_point = closest_node
                print(f"First point selected: {self.selected_point}")
            else:
                if self.graph.has_edge(self.selected_point, closest_node):
                    self.graph.remove_edge(self.selected_point, closest_node)
                    self.draw_wall_endpoints()
                    self.action_history.append(("remove_edge", self.selected_point, closest_node))
                self.selected_point = None
                self.delink_points_active = False
                print(f"Edge removed between {self.selected_point} and {closest_node}")

    def find_closest_node(self, point):
        closest_node = min(self.graph.nodes, key=lambda n: np.linalg.norm(np.array(self.graph.nodes[n]['coord']) - np.array(point)))
        return closest_node

    def process(self):
        # Placeholder for the process logic
        print("Processing...")
        if self.csv_path and self.img_path:
            self.graph.clear() # Remove all nodes and edges from the graph
            self.visualise_boundingbox(self.csv_path, self.img_path)
            # self.print_graph_edges()
            self.display_image()
            self.draw_wall_endpoints()
            # self.print_graph()
    
    def visualise_boundingbox(self, csv, img):
        # Read image and csv files
        results_df = pd.read_csv(csv)
        input_img = cv2.imread(img)
        # Image Dimensions
        img_height, img_width = input_img.shape[:2]

        wall_endpoints_pairs = []
        for index, row in results_df.iterrows():
            x1 = int(row['xmin'])
            y1 = int(row['ymin'])
            x2 = int(row['xmax'])
            y2 = int(row['ymax'])
            start_point, end_point = self.wall_endpoints(x1, y1, x2, y2)
            wall_endpoints_pairs.append([start_point, end_point]) # List of walls, each wall is a list with 2 coordinate tuples  
        # print(wall_endpoints_pairs)
        
        wall_endpoints_np = np.array([point for pair in wall_endpoints_pairs for point in pair])
        eps = self.calculate_eps((img_width, img_height), scale_factor=0.03)
        clustered_wall_endpoints = self.cluster_coordinates(wall_endpoints_np, eps)
        # print(clustered_wall_endpoints)
        snapped_wall_endpoints = self.snap_coordinates(clustered_wall_endpoints)
        # print(snapped_wall_endpoints)
        self.add_nodes_and_edges(wall_endpoints_pairs, snapped_wall_endpoints)
    
    def wall_endpoints(self, xmin, ymin, xmax, ymax):
        """
        Determine the start and end points of the wall based on its bounding box (xyxy coordinates).
        """
        width = abs(xmax - xmin)
        height = abs(ymax - ymin)
        if height >= width:
            x_top, y_top = xmin + (width / 2), ymin
            x_bottom, y_bottom = xmin + (width / 2), ymax
            return (x_top, y_top), (x_bottom, y_bottom)
        else:
            x_right, y_right = xmin, ymin + (height / 2)
            x_left, y_left = xmax, ymin + (height / 2)
            return (x_right, y_right), (x_left, y_left)
    
    def calculate_eps(self, image_size, scale_factor=0.01):
        """
        Compute the epsilon value for DBSCAN clustering based on the image size.
        Epsilon value is the maximum distance between two samples for one to be considered as in the neighborhood of the other. This is not a maximum bound on the distances of points within a cluster. 
        """
        width, height = image_size
        diagonal = np.sqrt(width**2 + height**2)
        eps = scale_factor * diagonal
        return eps
    
    def cluster_coordinates(self, coordinates, eps, min_samples=1):
        """
        Clusters the coordinates using DBSCAN and computes centroids of clusters.
        """
        clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(coordinates)
        unique_labels = set(clustering.labels_)
        clustered_coordinates = [] # List of clustered coordinates

        # Calculate Centroids of Clusters
        for label in unique_labels: # looping through each of the unique centroids
            if label == -1:
                # The label -1 is used by DBSCAN to indicate noise points, which are not part of any cluster. 
                continue
            class_member_mask = (clustering.labels_ == label)
            cluster = coordinates[class_member_mask]
            centroid = cluster.mean(axis=0)
            clustered_coordinates.append(tuple(centroid))
        return clustered_coordinates # returns the list of centroids
    
    def snap_coordinates(self, points, threshold=10):
        """
        Snaps points that are within a certain threshold to their average position to reduce noise.
        """
        snapped_points = [list(point) for point in points] # Converting pts from immutable tuples to mutable lists 

        for i in range(len(snapped_points)):
            for j in range(i + 1, len(snapped_points)):
                # Check if coordinate dist. wrt x axis < threshold
                if abs(snapped_points[i][0] - snapped_points[j][0]) < threshold:
                    avg_x = (snapped_points[i][0] + snapped_points[j][0]) / 2
                    snapped_points[i][0] = avg_x
                    snapped_points[j][0] = avg_x
                # Check if coordinate dist. wrt y axis < threshold
                if abs(snapped_points[i][1] - snapped_points[j][1]) < threshold:
                    avg_y = (snapped_points[i][1] + snapped_points[j][1]) / 2
                    snapped_points[i][1] = avg_y
                    snapped_points[j][1] = avg_y

        # Converting pts from mutable lists to immutable tuples 
        snapped_points = [tuple(point) for point in snapped_points]
        return snapped_points
    
    def add_nodes_and_edges(self, wall_endpoints_pairs, snapped_wall_endpoints):
        node_id = 0 # counter to assign unique IDs to nodes
        for pair in wall_endpoints_pairs:
            start, end = pair
            # Find closest point at start and end of wall
            snapped_start = self.find_closest_point(start, snapped_wall_endpoints)
            # print("snapped_wall_endpoints:", snapped_wall_endpoints) # List of tuples
            # print("Snapped Start:",snapped_start) # Tuple
            snapped_end = self.find_closest_point(end, snapped_wall_endpoints)
                        
            if snapped_start not in self.graph:
                self.graph.add_node(node_id, coord=snapped_start)
                node_id += 1
            if snapped_end not in self.graph:
                self.graph.add_node(node_id, coord=snapped_end)
                node_id += 1
            self.graph.add_edge(self.get_node_id_by_coord(snapped_start), self.get_node_id_by_coord(snapped_end))
    
    def find_closest_point(self, target_point, points):
        """
        Finds the closest point in a list of points to a given target point.(Euclidean distance)
        """
        closest_point = min(points, key=lambda point: np.linalg.norm(np.array(point) - np.array(target_point)))
        return closest_point
    
    def get_node_id_by_coord(self, coord):
        """
        Retrieves the node ID corresponding to a given coordinate.
        """
        for node_id, data in self.graph.nodes(data=True):
            if data['coord'] == coord:
                # print(f"{node_id}:{coord}")
                return node_id
        return None

if __name__ == "__main__":
    root = tk.Tk()
    app = WallEndpointsEditor(root)
    root.mainloop()

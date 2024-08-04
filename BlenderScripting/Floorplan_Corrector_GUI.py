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

"""
Upload csv, upload image, process, save, add point, link point, delink point, modify point
"""

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
        
        self.save_button = tk.Button(button_frame, text="Save", command=self.save)
        self.save_button.grid(row=0, column=6, sticky='ew', padx=5)
        
        self.modify_button = tk.Button(button_frame, text="Modify Point", command=self.modify_point_mode)
        self.modify_button.grid(row=0, column=7, sticky='ew', padx=5)

        self.canvas.bind("<Button-1>", self.handle_canvas_click)
        self.canvas.bind("<B1-Motion>", self.handle_canvas_drag)

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
        self.delink_points_active = False
        self.modify_point_active = False

    def link_points_mode(self):
        self.link_points_active = True
        self.add_point_active = False
        self.delink_points_active = False
        self.modify_point_active = False
        self.selected_point = None

    def delink_points_mode(self):
        self.delink_points_active = True
        self.add_point_active = False
        self.link_points_active = False
        self.modify_point_active = False
        self.selected_point = None
    
    def modify_point_mode(self):
        self.modify_point_active = True
        self.add_point_active = False
        self.link_points_active = False
        self.delink_points_active = False
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

        elif self.modify_point_active:
            self.selected_point = self.find_closest_node((x, y))
            print(f"Selected point for modification: {self.selected_point}")

    def handle_canvas_drag(self, event):
        if self.modify_point_active and self.selected_point is not None:
            x = event.x / self.scale_factor_x
            y = event.y / self.scale_factor_y
            self.graph.nodes[self.selected_point]['coord'] = (x, y)
            self.draw_wall_endpoints()

    def find_closest_node(self, point):
        closest_node = min(self.graph.nodes, key=lambda n: np.linalg.norm(np.array(self.graph.nodes[n]['coord']) - np.array(point)))
        return closest_node

    def process(self):
        # Placeholder for the process logic
        print("Processing...")
        if self.csv_path and self.img_path:
            self.graph.clear() # Remove all nodes and edges from the graph
            self.visualise_boundingbox(self.csv_path, self.img_path)
            self.print_graph_statistics()
            self.display_image()
            self.draw_wall_endpoints()

    def visualise_boundingbox(self, csv, img):
        # Read image and csv files
        results_df = pd.read_csv(csv)
        input_img = cv2.imread(img)
        # Image Dimensions
        img_height, img_width = input_img.shape[:2]

        wall_endpoints_pairs = []
        for _, row in results_df.iterrows():
            if row['name'] == 'wall':
                x1, y1 = int(row['xmin']), int(row['ymin'])
                x2, y2 = int(row['xmax']), int(row['ymax'])
                cv2.rectangle(input_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.circle(input_img, (x1, y1), 5, (0, 0, 255), -1)
                cv2.circle(input_img, (x2, y2), 5, (0, 0, 255), -1)
                wall_endpoints_pairs.append([(x1, y1), (x2, y2)])

        self.wall_endpoints_pairs = wall_endpoints_pairs
        print("Wall Endpoints Pairs: ", wall_endpoints_pairs)

        cluster_model = DBSCAN(eps=30, min_samples=1)
        cluster_points = [pt for pair in wall_endpoints_pairs for pt in pair]
        cluster_model.fit(cluster_points)
        cluster_labels = cluster_model.labels_

        clusters = {}
        for point, label in zip(cluster_points, cluster_labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(point)

        cluster_centers = [np.mean(clusters[label], axis=0).astype(int).tolist() for label in clusters]

        self.graph.clear()  # Clear the graph before adding new nodes and edges
        for idx, center in enumerate(cluster_centers):
            self.graph.add_node(idx, coord=center)

        for pair in wall_endpoints_pairs:
            node1 = self.find_closest_node(pair[0])
            node2 = self.find_closest_node(pair[1])
            if node1 != node2:
                self.graph.add_edge(node1, node2)

        self.print_graph_statistics()

    def print_graph_statistics(self):
        print(f"Graph Nodes: {len(self.graph.nodes)}")
        print(f"Graph Edges: {len(self.graph.edges)}")

    def save(self):
        save_path = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON files", "*.json")])
        if save_path:
            data = {
                "nodes": {node: {"coord": list(map(float, self.graph.nodes[node]['coord']))} for node in self.graph.nodes},
                "edges": list(self.graph.edges)
            }
            with open(save_path, 'w') as f:
                json.dump(data, f, indent=4)
            print(f"Graph saved to {save_path}")

if __name__ == "__main__":
    root = tk.Tk()
    app = WallEndpointsEditor(root)
    root.mainloop()

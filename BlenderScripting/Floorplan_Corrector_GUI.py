import tkinter as tk  # Used for creating the GUI.
from tkinter import filedialog  # Module in tkinter to open file dialogs.
import cv2  # Used for image processing.
from PIL import Image, ImageTk  # Used to handle images in the GUI.
import os
import pandas as pd  # Used to handle CSV file data.
import numpy as np  # Used for numerical operations.
from sklearn.cluster import DBSCAN  # DBSCAN is used for clustering points.
import json  # json is used to save and load JSON files.
import networkx as nx  # NetworkX is used for graph-based data structure.

"""
Upload csv, upload image, process, save, add point, link point, delink point, modify point, delete point, undo
"""

class WallEndpointsEditor:
    # The class WallEndpointsEditor is defined to manage the application.
    def __init__(self, root):
        ########## Create a root tkinter window and title it ##########
        self.root = root
        self.root.title("Wall Endpoints Editor")

        ########## Create GUI (Canvas for hosting image/drawings + Frame for hosting buttons) ##########        
        self.canvas = tk.Canvas(self.root, cursor="cross")
        self.canvas.pack(fill=tk.BOTH, expand=True)

        button_frame = tk.Frame(self.root)
        button_frame.pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=10)

        # Initialize canvas dimensions ##########
        self.canvas_width = 1280
        self.canvas_height = 720

        ########## Define constants ##########
        self.csv_path = ""
        self.img_path = ""
        self.graph = nx.Graph()
        self.action_history = []
        self.selected_point = None
        self.snapping_enabled = True
        self.wall_endpoints_pairs = []

        self.image = None
        self.image_tk = None

        # Add corresponding tracking variables ##########
        self.add_point_active = False
        self.link_points_active = False
        self.delink_points_active = False
        self.modify_point_active = False

        self.scale_factor_x = 1
        self.scale_factor_y = 1

        # Buttons on GUI frame ##########
        self.no_of_btns = 10 # No. of buttons on GUI frame
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
        
        self.delete_button = tk.Button(button_frame, text="Delete Point", command=self.delete_point_mode)
        self.delete_button.grid(row=0, column=8, sticky='ew', padx=5)
        
        self.undo_button = tk.Button(button_frame, text="Undo", command=self.undo)
        self.undo_button.grid(row=0, column=9, sticky='ew', padx=5)
        
        # ------------------- Code to spread btns in frame -------------------
        # for i in range(self.total_buttons):
        #     button_frame.grid_columnconfigure(i, weight=1)
        # --------------------------------------------------------------------
        
        # tkinter uses bind fn. to bind functionality for various tkinter events(https://stackoverflow.com/questions/32289175/list-of-all-tkinter-events) 

        self.canvas.bind("<Button-1>", self.handle_canvas_click)
        self.canvas.bind("<B1-Motion>", self.handle_canvas_drag)

    def upload_csv(self):
        """
        Opens a file dialog to select a CSV file and stores the path.
        """
        self.csv_path = filedialog.askopenfilename(filetypes=[("CSV files", "*.csv")])
        print(f"CSV path: {self.csv_path}")

    def upload_image(self):
        """
        Opens a file dialog to select an image file, stores the path, and calls display_image()
        """
        self.img_path = filedialog.askopenfilename(filetypes=[("Image files", "*.jpg *.png *.jpeg")])
        print(f"Image path: {self.img_path}")
        self.display_image()

    def display_image(self):
        """
        Show the image from upload_image() on the canvas.
        """
        if self.img_path:
            img = cv2.imread(self.img_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            self.image = Image.fromarray(img)
            original_width, original_height = self.image.size
            aspect_ratio = original_width / original_height
            if (aspect_ratio > 1):
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
    
    def process(self):
        """
        Logic to visualise the YOLO based bounding boxes for wall detection and its corresponding endpoints 
        """
        if self.csv_path and self.img_path:
            self.graph.clear() # Remove all nodes and edges from the graph
            self.visualise_boundingbox(self.csv_path, self.img_path)
            self.print_graph_statistics()
            self.display_image()
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
    
    def delete_point_mode(self):
        self.delete_point_active = True
        self.add_point_active = False
        self.link_points_active = False
        self.delink_points_active = False
        self.modify_point_active = False
        self.selected_point = None

    ########## Tkinter Events response functionality ##########
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
        
        elif self.delete_point_active:
            closest_node = self.find_closest_node((x, y))
            if closest_node in self.graph.nodes:
                self.graph.remove_node(closest_node)
                self.draw_wall_endpoints()
                self.action_history.append(("remove_node", closest_node))
                self.delete_point_active = False
                print(f"Point {closest_node} deleted")

    def handle_canvas_drag(self, event):
        if self.modify_point_active and self.selected_point is not None:
            x = event.x / self.scale_factor_x
            y = event.y / self.scale_factor_y
            self.graph.nodes[self.selected_point]['coord'] = (x, y)
            self.draw_wall_endpoints()

    def find_closest_node(self, point):
        """
        Finds the closest point in a list of points to a given target point.(Euclidean distance)
        """
        closest_node = min(self.graph.nodes, key=lambda n: np.linalg.norm(np.array(self.graph.nodes[n]['coord']) - np.array(point)))
        return closest_node

    

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
        """
        Prints the graph statistics: nodes and edges
        """
        print(f"Graph Nodes: {len(self.graph.nodes)}")
        print(f"Graph Nodes: {self.graph.nodes}")
        print(f"Graph Edges: {len(self.graph.edges)}")
        print(f"Graph Edges: {self.graph.edges}")

    def save(self):
        """
        Save the wallendpoints and its corresponding walls as a json file. 
        """
        save_path = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON files", "*.json")])
        if save_path:
            data = {
                "nodes": {node: {"coord": list(map(float, self.graph.nodes[node]['coord']))} for node in self.graph.nodes},
                "edges": list(self.graph.edges)
            }
            with open(save_path, 'w') as f:
                json.dump(data, f, indent=4)
            print(f"Graph saved to {save_path}")

    def undo(self):
        """
        Undo the last action performed on the graph. If no actions have been performed, do nothing.
        """
        if not self.action_history:
            return

        last_action = self.action_history.pop()
        action_type = last_action[0]

        if action_type == "add_node":
            node_id = last_action[1]
            self.graph.remove_node(node_id)

        elif action_type == "remove_node":
            node_id = last_action[1]
            coord = last_action[2]
            self.graph.add_node(node_id, coord=coord)

        elif action_type == "add_edge":
            node1, node2 = last_action[1], last_action[2]
            self.graph.remove_edge(node1, node2)

        elif action_type == "remove_edge":
            node1, node2 = last_action[1], last_action[2]
            self.graph.add_edge(node1, node2)

        self.draw_wall_endpoints()

if __name__ == "__main__":
    root = tk.Tk()
    app = WallEndpointsEditor(root)
    root.mainloop()

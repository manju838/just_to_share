import os
import pandas as pd
import cv2
from google.colab.patches import cv2_imshow
import numpy as np
from sklearn.cluster import DBSCAN

"""
Takes in a csv file that has bounding box params from yolov9 and 
* Generates the wall endpoints
* Cluster and merge endpoints within a certain range into a single point, img size considered (wall corners)
* Visualise bounding boxes as well as wall endpoints, save overlapped images of them
"""

def calculate_eps(image_size, scale_factor=0.01):
    width, height = image_size
    diagonal = np.sqrt(width**2 + height**2)
    eps = scale_factor * diagonal
    return eps

def cluster_coordinates(coordinates, eps, min_samples=1):
    clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(coordinates)
    unique_labels = set(clustering.labels_)
    clustered_coordinates = []

    for label in unique_labels:
        if label == -1:  # Noise
            continue
        class_member_mask = (clustering.labels_ == label)
        cluster = coordinates[class_member_mask]
        centroid = cluster.mean(axis=0)
        clustered_coordinates.append(tuple(centroid))
    
    return clustered_coordinates

def wall_endpoints(xmin, ymin, xmax, ymax):
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

def visualise_boundingbox(csv, img):
  path = "/content/drive/MyDrive/Coding_central/FreshTrialYolo/"
  savepath = "/content/drive/MyDrive/Coding_central/FreshTrialYolo/saved_vis"

  os.makedirs(savepath, exist_ok=True)

  csv_file = os.path.join(path, csv)
  img_file = os.path.join(path, img)
  
  # Load DataFrame from CSV
  results_df = pd.read_csv(csv_file)

  # Results of running model on specific image i.e. Inference
  input_img = cv2.imread(img_file)
  img_height, img_width = input_img.shape[:2]

  wall_endpoints_list = []

  # Draw bounding boxes on the image
  for index, row in results_df.iterrows():
      x1 = int(row['xmin'])
      y1 = int(row['ymin'])
      x2 = int(row['xmax'])
      y2 = int(row['ymax'])
      # print(index, (x1,y1), (x2,y2))
      box_color = (0, 255, 0) # Color of boundingbox
      thickness = 2 # Thickness of bounding box
      cv2.rectangle(input_img, (x1, y1), (x2, y2), box_color, thickness)

      # Get wall endpoints
      start_point, end_point = wall_endpoints(x1, y1, x2, y2)
      wall_endpoints_list.extend([start_point, end_point])
    
  # Convert to numpy array for clustering
  wall_endpoints_np = np.array(wall_endpoints_list)

  # Calculate dynamic eps value
  eps = calculate_eps((img_width, img_height), scale_factor=0.02)

  # Cluster the wall endpoints
  clustered_wall_endpoints = cluster_coordinates(wall_endpoints_np, eps)

    # Draw clustered wall endpoints
  endpoint_color = (0, 0, 255)  # Color for wall endpoints
  for point in clustered_wall_endpoints:
      cv2.circle(input_img, (int(point[0]), int(point[1])), radius=5, color=endpoint_color, thickness=2)

  # Save the image with bounding boxes to Google Drive
  output_file = os.path.join(savepath, img)
  cv2.imwrite(output_file, input_img)
  print(f"Saved processed image to {output_file}")

  cv2_imshow(input_img)
  cv2.waitKey(0)


csv_list = [
    ("propall1_inference_results.csv", "propall1.png"),
    ("propall2_inference_results.csv", "propall2.jpg"),
    ("train1_inference_results.csv", "train1.jpg"),
    ("train2_inference_results.csv", "train2.jpg"),
    ("train3_inference_results.csv", "train3.jpg"),
    ("train4_inference_results.csv", "train4.jpg")
]

for csv, image in csv_list:
    visualise_boundingbox(csv, image)

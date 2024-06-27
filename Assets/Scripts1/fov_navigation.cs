using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class fov_navigation : MonoBehaviour
{
    // Assign the root GameObject of the scene in the Inspector
    public GameObject sceneRoot;         

    // Define speeds for rotation and translation
    public float movementSpeed = 2.0f;   // Speed of camera movement
    public float rotationSpeed = 25.0f;  // Speed of camera rotation
    // Parameters for Mouse based control (left mouse click)
    public float mouseSensitivity = 100.0f;  // Sensitivity for mouse movement
    private Vector3 lastMousePosition; // Store the last mouse position
    private bool isRotatingWithMouse = false; // Track if we're currently rotating with the mouse

    // CharacterController component for the camera
    private CharacterController characterController;

    // Awake methods are always called before the start method
    void Awake(){
         // Get or add the CharacterController component attached to the camera
        characterController = GetComponent<CharacterController>();
        if (characterController == null)
        {
            characterController = gameObject.AddComponent<CharacterController>();
        }
    }

    // Start is called before the first frame update
    void Start()
    {
        // Center the camera in the scene by placing it at the midpoint of the scene
        CenterCamera();

       
    }

    // Update is called once per frame
    void Update()
    {
        // Handle camera movement and rotation each frame
        HandleMovement();
        HandleRotation();

        // Handle mouse input for rotation
        HandleMouseRotation();
    }

    Vector3 CalculateCenter(GameObject root)
    {
        // Get all renderers in the scene
        Renderer[] renderers = root.GetComponentsInChildren<Renderer>();

        if (renderers.Length == 0)
        {
            Debug.LogWarning("No renderers found in the scene.");
            return Vector3.zero;
        }

        // Initialize bounds with the first renderer
        Bounds bounds = renderers[0].bounds;

        // Encapsulate all renderers' bounds
        foreach (Renderer renderer in renderers)
        {
            bounds.Encapsulate(renderer.bounds);
        }

        // The center of the bounds is the center of the scene
        return bounds.center;
    }

    void CenterCamera()
    {
        // Find the center of the scene using the CalculateCenter method
        Vector3 sceneCenter = CalculateCenter(sceneRoot);

        // Center the camera to the midpoint of the scene.
        transform.position = sceneCenter;
    }

    void HandleMovement()
    {
        // Initialize movement vectors
        Vector3 movement = Vector3.zero;

        // Front-Back Movement
        if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow))
        {
            movement += transform.forward * movementSpeed * Time.deltaTime;
        }
        if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow))
        {
            movement += -transform.forward * movementSpeed * Time.deltaTime;
        }

        // Strafe Movement (Left-Right movement)
        if (Input.GetKey(KeyCode.A))
        {
            movement += -transform.right * movementSpeed * Time.deltaTime;
        }
        if (Input.GetKey(KeyCode.D))
        {
            movement += transform.right * movementSpeed * Time.deltaTime;
        }

        // Height Movement
        if (Input.GetKey(KeyCode.Q))
        {
            movement += Vector3.up * movementSpeed * Time.deltaTime;
        }
        if (Input.GetKey(KeyCode.E))
        {
            movement += Vector3.down * movementSpeed * Time.deltaTime;
        }

        // Apply the movement to the camera using the CharacterController
        characterController.Move(movement);
    }

    void HandleRotation()
    {
        // Rotate the camera left/right with Left and Right arrow keys
        if (Input.GetKey(KeyCode.LeftArrow))
        {
            transform.Rotate(Vector3.up, -rotationSpeed * Time.deltaTime);
        }
        if (Input.GetKey(KeyCode.RightArrow))
        {
            transform.Rotate(Vector3.up, rotationSpeed * Time.deltaTime);
        }

        // Optional: Pitch rotation up/down with 'R' and 'F' keys
        if (Input.GetKey(KeyCode.R))
        {
            transform.Rotate(Vector3.right, -rotationSpeed * Time.deltaTime);
        }
        if (Input.GetKey(KeyCode.F))
        {
            transform.Rotate(Vector3.right, rotationSpeed * Time.deltaTime);
        }
    }

    void HandleMouseRotation()
    {
        if (Input.GetMouseButtonDown(0))
        {
            // Start rotating with the mouse
            isRotatingWithMouse = true;
            lastMousePosition = Input.mousePosition;
        }

        if (Input.GetMouseButtonUp(0))
        {
            // Stop rotating with the mouse
            isRotatingWithMouse = false;
        }

        if (isRotatingWithMouse)
        {
            Vector3 currentMousePosition = Input.mousePosition;
            Vector3 deltaMousePosition = currentMousePosition - lastMousePosition;

            // Calculate rotation based on mouse movement
            float horizontalRotation = deltaMousePosition.x * mouseSensitivity * Time.deltaTime;
            float verticalRotation = -deltaMousePosition.y * mouseSensitivity * Time.deltaTime;

            // Apply rotation to the camera
            transform.Rotate(Vector3.up, horizontalRotation, Space.World);
            transform.Rotate(Vector3.right, verticalRotation, Space.Self);

            // Update the last mouse position
            lastMousePosition = currentMousePosition;
        }
    }
}

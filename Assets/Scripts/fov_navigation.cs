using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class fov_navigation : MonoBehaviour
{
    // FOV Navigation final trial 21/6/24
    // Define speeds for rotation and translation
    public float movementSpeed = 2.0f;   // Speed of camera movement
    public float rotationSpeed = 25.0f;  // Speed of camera rotation

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
        
    }
            void CenterCamera()
    {
        // Center the camera to the midpoint of the scene.
        // Assuming the scene is centered at (0,0,0) for simplicity. Adjust accordingly if your scene has a different center.
        Vector3 sceneCenter = new Vector3(0, 0, 0); // Change this if your scene's center is different
        transform.position = sceneCenter;
    }
            void HandleMovement()
    {
        // Initialize movement vectors
        Vector3 forwardMovement = Vector3.zero;
        Vector3 strafeMovement = Vector3.zero;
        Vector3 verticalMovement = Vector3.zero;

        // Front-Back Movement
        // Move the camera forward/backward with 'W' and 'S' keys
        if (Input.GetKey(KeyCode.W))
        {
            forwardMovement = transform.forward * movementSpeed * Time.deltaTime;
        }
        if (Input.GetKey(KeyCode.S))
        {
            forwardMovement = -transform.forward * movementSpeed * Time.deltaTime;
        }
        // Alternatively move the camera forward/backward with Up and Down arrow keys
        if (Input.GetKey(KeyCode.UpArrow))
        {
            forwardMovement = transform.forward * movementSpeed * Time.deltaTime;
        }
        if (Input.GetKey(KeyCode.DownArrow))
        {
            forwardMovement = -transform.forward * movementSpeed * Time.deltaTime;
        }

        // Strafe Movement(Left-Right movement)
        // Move the camera left/right with 'A' and 'D' keys
        if (Input.GetKey(KeyCode.A))
        {
            strafeMovement = -transform.right * movementSpeed * Time.deltaTime;
        }
        if (Input.GetKey(KeyCode.D))
        {
            strafeMovement = transform.right * movementSpeed * Time.deltaTime;
        }

        // Height Movement
        // Move the camera up/down with Q and E keys
        if (Input.GetKey(KeyCode.Q))
        {
            verticalMovement = Vector3.up * movementSpeed * Time.deltaTime;
        }
        if (Input.GetKey(KeyCode.E))
        {
            verticalMovement = Vector3.down * movementSpeed * Time.deltaTime;
        }

        

        // Apply the movement to the camera
        transform.position += forwardMovement + strafeMovement + verticalMovement;
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
}

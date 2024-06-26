using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class AddColliders : MonoBehaviour
{
    // Assign the root GameObject of the scene in the Inspector
    public GameObject sceneRoot;

    // Start is called before the first frame update
    void Start()
    {
        if (sceneRoot != null)
        {
            AddCollidersToAllChildren(sceneRoot);
        }
        else
        {
            Debug.LogWarning("Scene root not assigned.");
        }
    }

    void AddCollidersToAllChildren(GameObject root)
    {
        Renderer[] renderers = root.GetComponentsInChildren<Renderer>();

        foreach (Renderer renderer in renderers)
        {
            GameObject obj = renderer.gameObject;

            // Check if the object already has a collider
            if (obj.GetComponent<Collider>() == null)
            {
                // Add appropriate collider based on the renderer or mesh
                if (renderer is MeshRenderer)
                {
                    obj.AddComponent<MeshCollider>().convex = true;
                }
                else if (renderer is SkinnedMeshRenderer)
                {
                    obj.AddComponent<MeshCollider>().convex = true;
                }
                else if (renderer is SpriteRenderer)
                {
                    obj.AddComponent<BoxCollider2D>();
                }
                else
                {
                    // Default to BoxCollider for any other type of renderer
                    obj.AddComponent<BoxCollider>();
                }
            }
        }
    }
}

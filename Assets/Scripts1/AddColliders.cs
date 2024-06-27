using UnityEngine;

public class AddColliders : MonoBehaviour
{
    void Start()
    {
        AddCollidersToChildren(transform);
    }

    void AddCollidersToChildren(Transform parent)
    {
        foreach (Transform child in parent)
        {
            if (child.gameObject.GetComponent<Collider>() == null)
            {
                child.gameObject.AddComponent<BoxCollider>();
            }
            // Recursively add colliders to the children
            AddCollidersToChildren(child);
        }
    }
}

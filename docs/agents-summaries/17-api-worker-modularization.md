I refactored the `api-worker` to be more modular and extensible.

Previously, the worker's logic was monolithic, making it difficult to adapt to different deployment environments. I introduced the Hono web framework to decouple the core application logic from the Cloudflare Worker runtime. This allows for a clean separation of concerns and makes it easier to add new providers in the future.

I also implemented a repository pattern for data access, creating `SubmissionRepository` and `SchemaRepository` interfaces. This abstracts the data layer, allowing for different implementations (e.g., D1, CDN with KV cache) to be easily swapped out.

Finally, I updated the documentation to reflect the new architecture and added comprehensive tests for the new components. This new modular design makes the `api-worker` more robust, maintainable, and ready for future expansion.
